import { dataStore } from '@/services/dataStore';
import { getOrganizationContext } from '@/services/organization/demoOrg';
import { getMaterialsLibrary } from '@/services/materialsLibrary/store';
import { getRecentSearches } from '@/services/purchaseAssistant/purchaseStorage';
import { getJournalHistory } from '@/services/siteJournal/storage';
import { computeProfitability } from '@/services/profitability/engine';
import { formatCurrency } from '@/utils/format';
import type {
  GlobalSearchCategory,
  GlobalSearchGroup,
  GlobalSearchResponse,
  GlobalSearchResultItem,
} from '@/types/globalSearch';

const CATEGORY_ORDER: GlobalSearchCategory[] = [
  'projects',
  'tasks',
  'teams',
  'materials',
  'suppliers',
  'documents',
  'reports',
  'aiAnalyses',
  'profitability',
];

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Recherche insensible à la casse sur plusieurs champs texte. */
function matchesQuery(query: string, ...parts: (string | number | undefined | null)[]): boolean {
  const q = normalizeQuery(query);
  if (!q) return false;
  return parts.some((p) => {
    if (p == null) return false;
    return String(p).toLowerCase().includes(q);
  });
}

function push(
  bucket: Map<GlobalSearchCategory, GlobalSearchResultItem[]>,
  category: GlobalSearchCategory,
  item: GlobalSearchResultItem
): void {
  const list = bucket.get(category) ?? [];
  if (list.some((x) => x.id === item.id)) return;
  list.push(item);
  bucket.set(category, list);
}

function toGroups(bucket: Map<GlobalSearchCategory, GlobalSearchResultItem[]>): GlobalSearchGroup[] {
  return CATEGORY_ORDER.filter((c) => (bucket.get(c)?.length ?? 0) > 0).map((category) => ({
    category,
    items: bucket.get(category)!,
  }));
}

/**
 * Recherche globale sur l’ensemble des jeux de données démo (marché France, EUR).
 */
export function runGlobalSearch(query: string): GlobalSearchResponse {
  const q = normalizeQuery(query);
  if (!q) return { groups: [], totalCount: 0 };

  dataStore.init();
  const bucket = new Map<GlobalSearchCategory, GlobalSearchResultItem[]>();

  const org = getOrganizationContext();
  for (const pr of org.projects) {
    if (
      matchesQuery(
        q,
        pr.name,
        pr.status,
        pr.id,
        formatCurrency(pr.budgetPlanned)
      )
    ) {
      push(bucket, 'projects', {
        id: `project-${pr.id}`,
        title: pr.name,
        subtitle: `Projet — budget ${formatCurrency(pr.budgetPlanned)} HT`,
        href: '/projets',
      });
    }
  }

  for (const ch of dataStore.getChantiers()) {
    if (
      matchesQuery(
        q,
        ch.name,
        ch.client,
        ch.address,
        ch.manager,
        ch.engineer,
        ch.description,
        ch.status
      )
    ) {
      push(bucket, 'projects', {
        id: `chantier-${ch.id}`,
        title: ch.name,
        subtitle: `${ch.client} — ${ch.address}`,
        href: `/suivi/${ch.id}`,
      });
    }
  }

  for (const task of dataStore.getTasks()) {
    if (
      matchesQuery(
        q,
        task.title,
        task.chantierName,
        task.roomName,
        task.assignee,
        task.status,
        task.priority,
        task.lot,
        task.roomName
      )
    ) {
      push(bucket, 'tasks', {
        id: `task-${task.id}`,
        title: task.title,
        subtitle: [task.chantierName, task.roomName, task.assignee].filter(Boolean).join(' · '),
        href: task.chantierId ? `/taches?chantier=${task.chantierId}` : '/taches',
      });
    }
  }

  const chantierById = new Map(dataStore.getChantiers().map((c) => [c.id, c.name]));
  for (const plan of dataStore.getPlanning()) {
    const chName = chantierById.get(plan.chantierId);
    if (matchesQuery(q, plan.title, chName, plan.team, plan.start, plan.end)) {
      push(bucket, 'tasks', {
        id: `plan-${plan.id}`,
        title: plan.title,
        subtitle: `Planning — ${chName ?? ''} · ${plan.team}`,
        href: '/planning',
      });
    }
  }

  for (const member of dataStore.getTeam()) {
    if (
      matchesQuery(
        q,
        member.name,
        member.trade,
        member.role,
        member.team,
        member.chantierName,
        member.email,
        member.phone
      )
    ) {
      push(bucket, 'teams', {
        id: `team-${member.id}`,
        title: member.name,
        subtitle: `${member.role} — ${member.team} · ${member.chantierName}`,
        href: '/equipe',
      });
    }
  }

  for (const worker of dataStore.getWorkers()) {
    if (matchesQuery(q, worker.name, worker.trade, worker.phone)) {
      const ch = dataStore.getChantiers().find((c) => c.id === worker.chantierId);
      push(bucket, 'teams', {
        id: `worker-${worker.id}`,
        title: worker.name,
        subtitle: `${worker.trade}${ch ? ` — ${ch.name}` : ''}`,
        href: '/equipe',
      });
    }
  }

  for (const mat of dataStore.getMaterials()) {
    if (
      matchesQuery(
        q,
        mat.name,
        mat.category,
        mat.chantierName,
        mat.supplierName,
        mat.unit,
        mat.status
      )
    ) {
      push(bucket, 'materials', {
        id: `mat-${mat.id}`,
        title: mat.name,
        subtitle: `${mat.chantierName} — ${mat.supplierName}`,
        href: mat.chantierId ? `/materiaux?chantier=${mat.chantierId}` : '/materiaux',
      });
    }
  }

  for (const req of dataStore.getMaterialRequests()) {
    if (
      matchesQuery(
        q,
        req.materialName,
        req.chantierName,
        req.requestedBy,
        req.unit,
        req.status
      )
    ) {
      push(bucket, 'materials', {
        id: `mreq-${req.id}`,
        title: req.materialName,
        subtitle: `Demande — ${req.chantierName} (${req.quantity} ${req.unit})`,
        href: '/materiaux',
      });
    }
  }

  for (const lib of getMaterialsLibrary()) {
    if (
      matchesQuery(
        q,
        lib.brand,
        lib.model,
        lib.description,
        lib.supplier,
        lib.notes,
        lib.category,
        lib.technicalSheet
      )
    ) {
      push(bucket, 'materials', {
        id: `lib-${lib.id}`,
        title: `${lib.brand} ${lib.model}`,
        subtitle: `${lib.description} — ${formatCurrency(lib.unitPrice)}/${lib.unit} · ${lib.supplier}`,
        href: '/bibliotheque-materiaux',
      });
    }
  }

  for (const row of dataStore.getFlooring()) {
    if (matchesQuery(q, row.designation, row.brand, row.model, row.zone, row.color, row.observation)) {
      push(bucket, 'materials', {
        id: `floor-${row.id}`,
        title: row.designation,
        subtitle: `Revêtement — ${row.zone} · ${row.brand} ${row.model}`,
        href: '/revetements',
      });
    }
  }

  for (const sup of dataStore.getSuppliers()) {
    const materialsText = sup.materials.join(' ');
    if (
      matchesQuery(
        q,
        sup.name,
        sup.contact,
        sup.address,
        sup.email,
        sup.phone,
        materialsText
      )
    ) {
      push(bucket, 'suppliers', {
        id: `sup-${sup.id}`,
        title: sup.name,
        subtitle: [sup.address, materialsText.slice(0, 60)].filter(Boolean).join(' — '),
        href: '/fournisseurs',
      });
    }
  }

  for (const doc of dataStore.getDocuments()) {
    if (
      matchesQuery(
        q,
        doc.name,
        doc.chantierName,
        doc.uploadedBy,
        doc.type,
        doc.tags?.join(' ')
      )
    ) {
      push(bucket, 'documents', {
        id: `doc-${doc.id}`,
        title: doc.name,
        subtitle: `${doc.chantierName} — ${doc.uploadedBy}`,
        href: '/documents',
      });
    }
  }

  const reportKinds = [
    { suffix: 'journalier', label: 'Rapport journalier' },
    { suffix: 'hebdomadaire', label: 'Rapport hebdomadaire' },
    { suffix: 'mensuel', label: 'Rapport mensuel' },
  ] as const;

  for (const ch of dataStore.getChantiers()) {
    const chRisks = dataStore.getRisks().filter((r) => r.chantierId === ch.id);
    const riskText = chRisks.map((r) => r.description).join(' ');
    for (const { suffix, label } of reportKinds) {
      const reportTitle = `${label} — ${ch.name}`;
      const body = [
        ch.name,
        ch.client,
        `avancement ${ch.progress}%`,
        `budget ${formatCurrency(ch.budgetConsumed)} HT`,
        `retards ${ch.delayDays} j`,
        riskText,
      ].join(' ');
      if (matchesQuery(q, reportTitle, body, suffix, label)) {
        push(bucket, 'reports', {
          id: `report-${ch.id}-${suffix}`,
          title: reportTitle,
          subtitle: `${ch.progress}% · ${formatCurrency(ch.budgetConsumed)} HT consommé`,
          href: '/rapports',
        });
      }
    }
  }

  for (const risk of dataStore.getRisks()) {
    if (matchesQuery(q, risk.description, risk.chantierName, risk.level, risk.type)) {
      push(bucket, 'aiAnalyses', {
        id: `risk-${risk.id}`,
        title: risk.description,
        subtitle: `Analyse risque — ${risk.chantierName}`,
        href: risk.chantierId ? `/risques?chantier=${risk.chantierId}` : '/risques',
      });
    }
  }

  for (const notif of dataStore.getNotifications()) {
    if (matchesQuery(q, notif.title, notif.message, notif.chantierName, notif.type)) {
      push(bucket, 'aiAnalyses', {
        id: `notif-${notif.id}`,
        title: notif.title,
        subtitle: notif.message,
        href: '/analyse-ia',
      });
    }
  }

  for (const mod of dataStore.getModifications()) {
    if (
      matchesQuery(
        q,
        mod.title,
        mod.description,
        mod.chantierName,
        mod.reason,
        mod.materials,
        mod.room
      )
    ) {
      push(bucket, 'aiAnalyses', {
        id: `mod-${mod.id}`,
        title: mod.title,
        subtitle: `Modification — ${mod.chantierName} · ${formatCurrency(mod.budgetImpact)} HT`,
        href: '/modifications',
      });
    }
  }

  for (const upd of dataStore.getFieldUpdates()) {
    if (
      matchesQuery(
        q,
        upd.content,
        upd.sender,
        upd.chantierName,
        upd.type,
        upd.aiAnalysis?.materialImpact,
        upd.aiAnalysis?.affectedRoom
      )
    ) {
      push(bucket, 'aiAnalyses', {
        id: `field-${upd.id}`,
        title: upd.content,
        subtitle: `Terrain → bureau — ${upd.chantierName}`,
        href: '/terrain',
      });
    }
  }

  for (const entry of getJournalHistory()) {
    if (
      matchesQuery(
        q,
        entry.chantierName,
        ...entry.workCompleted,
        ...entry.remainingTasks,
        ...entry.risksDetected,
        ...entry.recommendations
      )
    ) {
      push(bucket, 'aiAnalyses', {
        id: `journal-${entry.id}`,
        title: `Journal IA — ${entry.chantierName}`,
        subtitle: entry.recommendations[0] ?? entry.workCompleted[0] ?? 'Analyse photos terrain',
        href: '/journal-chantier-ia',
      });
    }
  }

  for (const purchase of getRecentSearches()) {
    if (
      matchesQuery(
        q,
        purchase.criteria.query,
        purchase.criteria.chantierName,
        purchase.criteria.productSearch,
        purchase.finalRecommendation,
        ...purchase.products.map((p) => p.productName),
        ...purchase.products.map((p) => p.supplier)
      )
    ) {
      push(bucket, 'aiAnalyses', {
        id: `purchase-${purchase.id}`,
        title: purchase.criteria.query.slice(0, 80) || 'Recherche achat IA',
        subtitle: purchase.finalRecommendation.slice(0, 100),
        href: '/assistant-achat',
      });
    }
  }

  for (const kpi of computeProfitability()) {
    const savingsText = kpi.savingsOpportunities.join(' ');
    if (
      matchesQuery(
        q,
        kpi.chantierName,
        kpi.mostExpensiveZone,
        kpi.mostExpensiveMaterial,
        savingsText,
        formatCurrency(kpi.estimatedProfit),
        formatCurrency(kpi.totalHt),
        formatCurrency(kpi.totalTtc)
      )
    ) {
      push(bucket, 'profitability', {
        id: `profit-${kpi.chantierId}`,
        title: kpi.chantierName,
        subtitle: `Marge ${kpi.profitMarginPercent}% · ${formatCurrency(kpi.totalHt)} HT · ${formatCurrency(kpi.totalTtc)} TTC`,
        href: `/centre-rentabilite`,
      });
    }
  }

  const groups = toGroups(bucket);
  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);
  return { groups, totalCount };
}
