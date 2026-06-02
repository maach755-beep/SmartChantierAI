import { randomUUID } from 'node:crypto';
import { loadDb, saveDb } from '../db/jsonStore.js';
import type {
  DevisDocument,
  MaterialChangeRequest,
  MaterialRecord,
  PlanExtractionJob,
  PlanExtractionResult,
  PlanPhotoComparison,
  ProjectRecord,
  RoomRecord,
  Tenant,
} from '../../shared/plan-extraction/types.js';

export class PlanExtractionRepository {
  getTenant(tenantId: string): Tenant | undefined {
    return loadDb().tenants.find((t) => t.id === tenantId);
  }

  listProjects(tenantId: string): ProjectRecord[] {
    return loadDb().projects.filter((p) => p.tenantId === tenantId);
  }

  getProject(projectId: string): ProjectRecord | undefined {
    return loadDb().projects.find((p) => p.id === projectId);
  }

  createJob(job: Omit<PlanExtractionJob, 'id' | 'createdAt'>): PlanExtractionJob {
    const db = loadDb();
    const record: PlanExtractionJob = {
      ...job,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.jobs.push(record);
    saveDb();
    return record;
  }

  updateJob(id: string, patch: Partial<PlanExtractionJob>): PlanExtractionJob | undefined {
    const db = loadDb();
    const idx = db.jobs.findIndex((j) => j.id === id);
    if (idx < 0) return undefined;
    db.jobs[idx] = { ...db.jobs[idx], ...patch };
    saveDb();
    return db.jobs[idx];
  }

  getJob(id: string): PlanExtractionJob | undefined {
    return loadDb().jobs.find((j) => j.id === id);
  }

  listJobs(projectId: string): PlanExtractionJob[] {
    return loadDb().jobs.filter((j) => j.projectId === projectId);
  }

  saveExtraction(result: PlanExtractionResult): void {
    const db = loadDb();
    db.extractions[result.jobId] = result;
    db.rooms = db.rooms.filter((r) => r.extractionId !== result.jobId);
    db.rooms.push(...result.rooms);
    db.materials = db.materials.filter((m) => m.projectId !== result.projectId);
    db.materials.push(...result.materials);
    saveDb();
  }

  getExtraction(jobId: string): PlanExtractionResult | undefined {
    return loadDb().extractions[jobId];
  }

  getRooms(projectId: string, extractionId?: string): RoomRecord[] {
    const rooms = loadDb().rooms.filter((r) => r.projectId === projectId);
    return extractionId ? rooms.filter((r) => r.extractionId === extractionId) : rooms;
  }

  getMaterials(projectId: string): MaterialRecord[] {
    return loadDb().materials.filter((m) => m.projectId === projectId);
  }

  getMaterial(id: string): MaterialRecord | undefined {
    return loadDb().materials.find((m) => m.id === id);
  }

  saveDevis(devis: DevisDocument): DevisDocument {
    const db = loadDb();
    db.devis.push(devis);
    saveDb();
    return devis;
  }

  listDevis(projectId: string): DevisDocument[] {
    return loadDb().devis.filter((d) => d.projectId === projectId);
  }

  saveChange(change: MaterialChangeRequest): MaterialChangeRequest {
    const db = loadDb();
    db.changes.push(change);
    saveDb();
    return change;
  }

  listChanges(projectId: string): MaterialChangeRequest[] {
    return loadDb().changes.filter((c) => c.projectId === projectId);
  }

  saveComparison(c: PlanPhotoComparison): PlanPhotoComparison {
    const db = loadDb();
    db.comparisons.push(c);
    saveDb();
    return c;
  }

  listComparisons(projectId: string): PlanPhotoComparison[] {
    return loadDb().comparisons.filter((c) => c.projectId === projectId);
  }

  updateProjectKpis(projectId: string, patch: Partial<ProjectRecord>): void {
    const db = loadDb();
    const idx = db.projects.findIndex((p) => p.id === projectId);
    if (idx < 0) return;
    db.projects[idx] = { ...db.projects[idx], ...patch, updatedAt: new Date().toISOString() };
    saveDb();
  }
}

export const planRepo = new PlanExtractionRepository();
