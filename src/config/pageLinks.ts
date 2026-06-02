/** Cross-page navigation keys — used with QuickNav + i18n nav.* */
export const pageLinks = {
  core: [
    { to: '/projets', labelKey: 'nav.projects' },
    { to: '/taches', labelKey: 'nav.tasks' },
    { to: '/equipe', labelKey: 'nav.team' },
    { to: '/materiaux', labelKey: 'nav.materials' },
  ],
  ai: [
    { to: '/analyse-ia', labelKey: 'nav.aiAnalysis' },
    { to: '/plan-extraction', labelKey: 'nav.planExtraction' },
    { to: '/plans', labelKey: 'nav.planAnalysis' },
    { to: '/revetements', labelKey: 'nav.flooring' },
    { to: '/analyse-situation-chantier', labelKey: 'nav.situationAnalysis' },
    { to: '/assistant-achat', labelKey: 'nav.purchaseAssistant' },
    { to: '/photos', labelKey: 'nav.photos' },
    { to: '/assistant', labelKey: 'nav.assistant' },
  ],
  ops: [
    { to: '/risques', labelKey: 'nav.risks' },
    { to: '/modifications', labelKey: 'nav.modifications' },
    { to: '/contrat', labelKey: 'nav.contract' },
    { to: '/planning', labelKey: 'nav.planning' },
  ],
  reports: [
    { to: '/rapports', labelKey: 'nav.reports' },
    { to: '/pilotage', labelKey: 'nav.commandCenter' },
    { to: '/', labelKey: 'nav.dashboard' },
  ],
} as const;

export function projectFilterLink(chantierId: string, page: 'taches' | 'materiaux' | 'photos') {
  return `/${page}?chantier=${chantierId}`;
}
