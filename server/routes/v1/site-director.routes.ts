import { Router } from 'express';
import { runSiteDirectorAnalysis } from '../../../shared/site-director/engine.js';
import { answerDirectorQuestion } from '../../../shared/site-director/qa.js';
import type { Lang, SiteDirectorSnapshot } from '../../../shared/site-director/types.js';

export const siteDirectorRouter = Router();

function normalizeSnapshot(input: SiteDirectorSnapshot): SiteDirectorSnapshot {
  return {
    chantiers: input.chantiers ?? [],
    risks: input.risks ?? [],
    materials: input.materials ?? [],
    suppliers: input.suppliers ?? [],
    tasks: input.tasks ?? [],
    team: input.team ?? [],
    attendance: input.attendance ?? [],
    modifications: input.modifications ?? [],
    materialRequests: input.materialRequests ?? [],
  };
}

siteDirectorRouter.post('/analyze', (req, res) => {
  try {
    const { snapshot, focusProjectId } = req.body as {
      snapshot: SiteDirectorSnapshot;
      focusProjectId?: string;
    };
    if (!snapshot?.chantiers?.length) {
      return res.status(400).json({ error: 'snapshot with chantiers required' });
    }
    const data = runSiteDirectorAnalysis(normalizeSnapshot(snapshot), focusProjectId);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Analyze failed' });
  }
});

siteDirectorRouter.post('/ask', (req, res) => {
  try {
    const { question, snapshot, focusProjectId, lang } = req.body as {
      question: string;
      snapshot: SiteDirectorSnapshot;
      focusProjectId?: string;
      lang?: Lang;
    };
    if (!question || !snapshot) {
      return res.status(400).json({ error: 'question and snapshot required' });
    }
    const answer = answerDirectorQuestion(
      question,
      normalizeSnapshot(snapshot),
      focusProjectId,
      lang ?? 'fr'
    );
    res.json({ data: { answer } });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Ask failed' });
  }
});

siteDirectorRouter.post('/briefing', (req, res) => {
  try {
    const { snapshot } = req.body as { snapshot: SiteDirectorSnapshot };
    if (!snapshot) return res.status(400).json({ error: 'snapshot required' });
    const analysis = runSiteDirectorAnalysis(normalizeSnapshot(snapshot));
    res.json({ data: analysis.briefing });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Briefing failed' });
  }
});
