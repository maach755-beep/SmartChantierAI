import type { Lang, SiteDirectorAnalysis, SiteDirectorSnapshot } from './types.js';
import { runSiteDirectorAnalysis } from './engine.js';

const patterns: { keys: string[]; answer: (a: SiteDirectorAnalysis, s: SiteDirectorSnapshot, lang: Lang) => string }[] = [
  {
    keys: ['delay', 'retard', 'late', 'why', 'pourquoi', 'تأخير', 'لماذا'],
    answer: (a, s, lang) => {
      const delayed = s.chantiers.filter((c) => c.delayDays > 0);
      const lines = delayed.map((c) => `• ${c.name}: +${c.delayDays}j (${c.status})`);
      const hdr = { fr: 'Retards identifiés:', ar: 'التأخيرات:', en: 'Delays identified:' };
      return `${hdr[lang]}\n${lines.join('\n') || '—'}\n\n${a.recommendations.slice(0, 3).map((r) => '→ ' + r.text).join('\n')}`;
    },
  },
  {
    keys: ['profit', 'marge', 'rentab', 'ربح', 'profitability'],
    answer: (a, _s, lang) => {
      const e = a.executive;
      const t = {
        fr: `Rentabilité estimée: ${e.profitabilityPercent}%. Trésorerie: ${e.cashFlowStatus}. Actions: ${a.coach.filter((c) => c.area === 'cost').map((c) => c.advice).join(' ')}`,
        ar: `الربحية: ${e.profitabilityPercent}%. التدفق: ${e.cashFlowStatus}.`,
        en: `Profitability: ${e.profitabilityPercent}%. Cash flow: ${e.cashFlowStatus}. ${a.coach[1]?.advice ?? ''}`,
      };
      return t[lang];
    },
  },
  {
    keys: ['today', "aujourd", 'aujourd\'hui', 'اليوم', 'do today'],
    answer: (a, _s, lang) => {
      const b = a.briefing;
      const t = { fr: 'Priorités du jour', ar: 'أولويات اليوم', en: "Today's priorities" };
      return `${t[lang]} (${b.date}):\n${b.priorities.map((p) => '• ' + p).join('\n')}\n\nUrgent:\n${b.urgentActions.map((u) => '• ' + u).join('\n')}`;
    },
  },
  {
    keys: ['supplier', 'fournisseur', 'مورد'],
    answer: (_a, s, lang) => {
      const bad = s.suppliers.filter((x) => x.performanceScore < 75 || x.lateDeliveries > 2);
      const hdr = { fr: 'Fournisseurs à surveiller:', ar: 'موردون حرجون:', en: 'Suppliers to watch:' };
      return `${hdr[lang]}\n${bad.map((x) => `• ${x.name} — score ${x.performanceScore}%, ${x.lateDeliveries} retards`).join('\n')}`;
    },
  },
  {
    keys: ['team', 'équipe', 'perform', 'under', 'équipe', 'فريق'],
    answer: (a, s, lang) => {
      const bySite = s.chantiers.map((c) => {
        const active = s.team.filter((t) => t.chantierId === c.id && t.active).length;
        const total = s.team.filter((t) => t.chantierId === c.id).length;
        return `• ${c.name}: ${active}/${total} actifs`;
      });
      const hdr = { fr: 'Performance équipes:', ar: 'أداء الفرق:', en: 'Team performance:' };
      return `${hdr[lang]}\n${bySite.join('\n')}\n\n${a.executive.workforcePerformancePercent}% présence globale.`;
    },
  },
  {
    keys: ['faster', 'vite', 'finish', 'terminer', 'أسرع'],
    answer: (a, _s, lang) => {
      const p = a.predictions;
      const t = {
        fr: `Probabilité délai dans les temps: ${p.onTimeProbability}%. Pour accélérer: ${a.recommendations.map((r) => r.text).slice(0, 4).join(' | ')}`,
        ar: `احتمال الالتزام بالموعد: ${p.onTimeProbability}%`,
        en: `On-time probability: ${p.onTimeProbability}%. Accelerate: add resources, reschedule non-critical path, validate avenants.`,
      };
      return t[lang];
    },
  },
];

export function answerDirectorQuestion(
  question: string,
  snapshot: SiteDirectorSnapshot,
  focusProjectId: string | undefined,
  lang: Lang
): string {
  const analysis = runSiteDirectorAnalysis(snapshot, focusProjectId);
  const q = question.toLowerCase();

  for (const p of patterns) {
    if (p.keys.some((k) => q.includes(k))) {
      return p.answer(analysis, snapshot, lang);
    }
  }

  const fallbacks = {
    fr: `Directeur IA — Score global ${analysis.health.globalScore}/100. ${analysis.reports[0]?.summary ?? ''} Posez: retards, profit, aujourd'hui, fournisseurs, équipes.`,
    ar: `المدير الذكي — النتيجة ${analysis.health.globalScore}/100.`,
    en: `AI Director — Global score ${analysis.health.globalScore}/100. Ask about delays, profit, today, suppliers, teams.`,
  };
  return fallbacks[lang];
}
