import { Router } from 'express';
import { runSiteDirectorAnalysis } from '../../../shared/site-director/engine.js';
import { answerDirectorQuestion } from '../../../shared/site-director/qa.js';
import type { Lang, SiteDirectorSnapshot } from '../../../shared/site-director/types.js';

export const siteDirectorRouter = Router();

siteDirectorRouter.post('/analyze', (req, res) => {
  const { snapshot, focusProjectId } = req.body as {
    snapshot: SiteDirectorSnapshot;
    focusProjectId?: string;
  };
  if (!snapshot?.chantiers?.length) {
    return res.status(400).json({ error: 'snapshot with chantiers required' });
  }
  const data = runSiteDirectorAnalysis(snapshot, focusProjectId);
  res.json({ data });
});

siteDirectorRouter.post('/ask', (req, res) => {
  const { question, snapshot, focusProjectId, lang } = req.body as {
    question: string;
    snapshot: SiteDirectorSnapshot;
    focusProjectId?: string;
    lang?: Lang;
  };
  if (!question || !snapshot) {
    return res.status(400).json({ error: 'question and snapshot required' });
  }
  const answer = answerDirectorQuestion(question, snapshot, focusProjectId, lang ?? 'fr');
  res.json({ data: { answer } });
});

siteDirectorRouter.post('/briefing', (req, res) => {
  const { snapshot } = req.body as { snapshot: SiteDirectorSnapshot };
  if (!snapshot) return res.status(400).json({ error: 'snapshot required' });
  const analysis = runSiteDirectorAnalysis(snapshot);
  res.json({ data: analysis.briefing });
});
