import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../../config/env.js';
import type { TenantRequest } from '../../middleware/tenant.js';
import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import { extractionPipeline } from '../../services/ai/PlanExtractionPipeline.js';
import { devisCalculator } from '../../services/devis/DevisCalculator.js';
import { changeImpactService } from '../../services/changes/ChangeImpactService.js';
import { TableExportService } from '../../services/export/TableExportService.js';
import { fieldPhotoSync } from '../../services/mobile/FieldPhotoSyncService.js';
import { planAssistant } from '../../services/assistant/PlanAssistantService.js';
import { planKpiService } from '../../services/kpi/PlanExtractionKpiService.js';
import type { PlanFileKind } from '../../../shared/plan-extraction/types.js';

const uploadDir = path.join(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: env.upload.maxMb * 1024 * 1024 },
});

function detectFileKind(mime: string, name: string): PlanFileKind {
  if (mime === 'application/pdf') return 'pdf';
  if (name.toLowerCase().includes('screenshot')) return 'screenshot';
  if (name.toLowerCase().includes('plan') && mime.startsWith('image/')) return 'colored_plan';
  if (mime.startsWith('image/')) return 'image';
  return 'technical_drawing';
}

export const planExtractionRouter = Router();

planExtractionRouter.get('/projects', (req, res) => {
  const tenantId = (req as TenantRequest).tenantId;
  res.json({ data: planRepo.listProjects(tenantId) });
});

planExtractionRouter.get('/projects/:projectId/kpis', (req, res) => {
  res.json({ data: planKpiService.compute(req.params.projectId) });
});

planExtractionRouter.post('/projects/:projectId/upload', upload.single('file'), async (req, res) => {
  try {
    const tenantId = (req as TenantRequest).tenantId;
    const projectId = req.params.projectId;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file required' });

    const job = planRepo.createJob({
      tenantId,
      projectId,
      fileName: file.originalname,
      fileKind: detectFileKind(file.mimetype, file.originalname),
      mimeType: file.mimetype,
      storagePath: file.path,
      status: 'queued',
      provider: env.ai.ocrProvider,
    });

    const result = await extractionPipeline.run(job.id);
    res.status(201).json({ data: { job, result } });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Upload failed' });
  }
});

planExtractionRouter.get('/jobs/:jobId', (req, res) => {
  const job = planRepo.getJob(req.params.jobId);
  const result = planRepo.getExtraction(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { job, result } });
});

planExtractionRouter.get('/projects/:projectId/extractions/latest', (req, res) => {
  const jobs = planRepo.listJobs(req.params.projectId);
  const latest = jobs[jobs.length - 1];
  if (!latest) return res.json({ data: null });
  res.json({ data: { job: latest, result: planRepo.getExtraction(latest.id) } });
});

planExtractionRouter.get('/projects/:projectId/rooms', (req, res) => {
  const extractionId = req.query.extractionId as string | undefined;
  res.json({ data: planRepo.getRooms(req.params.projectId, extractionId) });
});

planExtractionRouter.get('/projects/:projectId/materials', (req, res) => {
  res.json({ data: planRepo.getMaterials(req.params.projectId) });
});

planExtractionRouter.get('/extractions/:jobId/tables', (req, res) => {
  const result = planRepo.getExtraction(req.params.jobId);
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json({ data: result.tables });
});

planExtractionRouter.get('/extractions/:jobId/export/:format', (req, res) => {
  const result = planRepo.getExtraction(req.params.jobId);
  if (!result?.tables[0]) return res.status(404).json({ error: 'No tables' });
  const exporter = new TableExportService();
  const table = result.tables[0];
  const format = req.params.format;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="revetements.csv"`);
    return res.send(exporter.toCsv(table));
  }
  if (format === 'xlsx' || format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="revetements.xml"`);
    return res.send(exporter.toExcelXml(table));
  }
  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="revetements.pdf"`);
    return res.send(Buffer.from(exporter.toPdfText(table, 'Plan Extraction Export')));
  }
  return res.status(400).json({ error: 'format must be csv|pdf|excel' });
});

planExtractionRouter.post('/projects/:projectId/devis', (req, res) => {
  try {
    const { extractionId } = req.body as { extractionId: string };
    const devis = devisCalculator.generate(req.params.projectId, extractionId);
    res.status(201).json({ data: devis, purchaseList: devisCalculator.purchaseList(devis) });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Devis failed' });
  }
});

planExtractionRouter.post('/projects/:projectId/changes', (req, res) => {
  try {
    const tenantId = (req as TenantRequest).tenantId;
    const body = req.body as {
      roomId: string;
      oldMaterialId: string;
      newMaterialId: string;
      quantity: number;
    };
    const change = changeImpactService.applyChange({
      tenantId,
      projectId: req.params.projectId,
      ...body,
    });
    const oldMat = planRepo.getMaterial(body.oldMaterialId)!;
    const newMat = planRepo.getMaterial(body.newMaterialId)!;
    const avenant = changeImpactService.avenantPdfContent(change, oldMat, newMat);
    res.status(201).json({ data: change, avenantPdf: avenant });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Change failed' });
  }
});

planExtractionRouter.post('/projects/:projectId/field-photo', upload.single('photo'), async (req, res) => {
  try {
    const tenantId = (req as TenantRequest).tenantId;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'photo required' });
    const comparison = await fieldPhotoSync.ingestFieldPhoto({
      tenantId,
      projectId: req.params.projectId,
      photoId: (req.body.photoId as string) || file.filename,
      photoStoragePath: file.path,
      planJobId: req.body.planJobId as string | undefined,
    });
    res.status(201).json({ data: comparison });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Sync failed' });
  }
});

planExtractionRouter.get('/projects/:projectId/comparisons', (req, res) => {
  res.json({ data: planRepo.listComparisons(req.params.projectId) });
});

planExtractionRouter.post('/assistant', (req, res) => {
  const { projectId, extractionId, question, lang } = req.body as {
    projectId: string;
    extractionId?: string;
    question: string;
    lang?: 'fr' | 'ar' | 'en';
  };
  const ctx = planAssistant.getContext(projectId, extractionId);
  if (!ctx) return res.status(404).json({ error: 'Project not found' });
  const answer = planAssistant.answer(question, ctx, lang ?? 'fr');
  res.json({ data: { answer, context: ctx } });
});
