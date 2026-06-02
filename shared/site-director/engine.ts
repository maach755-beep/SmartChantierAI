import type {
  ActionPlanItem,
  AnalysisFinding,
  BusinessCoachInsight,
  ChantierHealthScore,
  DailyBriefing,
  DecisionSupport,
  ExecutiveMetrics,
  HealthDimensionScore,
  LearningInsight,
  ManagementRecommendation,
  PlanHorizon,
  ProjectAnalysisReport,
  SiteDirectorAnalysis,
  SiteDirectorSnapshot,
  StakeholderRole,
  SuccessPrediction,
} from './types.js';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function computeHealth(snapshot: SiteDirectorSnapshot, projectId?: string): ChantierHealthScore {
  const sites = projectId
    ? snapshot.chantiers.filter((c) => c.id === projectId)
    : snapshot.chantiers;
  if (!sites.length) {
    return { globalScore: 0, level: 'red', dimensions: [] };
  }

  const budgetScores = sites.map((c) => {
    const ratio = c.budgetPlanned > 0 ? c.budgetConsumed / c.budgetPlanned : 0;
    return clamp(100 - Math.max(0, ratio - 0.9) * 200);
  });

  const planningScores = sites.map((c) =>
    clamp(100 - c.delayDays * 3 - (c.status === 'delayed' ? 15 : 0) - (c.status === 'at_risk' ? 10 : 0))
  );

  const present = snapshot.attendance.filter((a) => a.present).length;
  const totalAtt = snapshot.attendance.length || 1;
  const productivityBase = clamp((present / totalAtt) * 100);
  const blockedTasks = snapshot.tasks.filter((t) => t.status === 'blocked').length;
  const productivityScores = sites.map(() =>
    clamp(productivityBase - blockedTasks * 2)
  );

  const safetyRisks = snapshot.risks.filter(
    (r) => r.type.includes('safety') || r.description.toLowerCase().includes('sécurité')
  ).length;
  const safetyScores = sites.map(() => clamp(100 - safetyRisks * 12));

  const pendingMods = snapshot.modifications.filter((m) => m.status === 'pending').length;
  const qualityScores = sites.map(() => clamp(100 - pendingMods * 5 - blockedTasks * 3));

  const redRisks = snapshot.risks.filter((r) => r.level === 'red').length;
  const orangeRisks = snapshot.risks.filter((r) => r.level === 'orange').length;
  const riskScores = sites.map((c) => {
    const siteR = snapshot.risks.filter((r) => r.chantierId === c.id);
    const red = siteR.filter((r) => r.level === 'red').length;
    const orange = siteR.filter((r) => r.level === 'orange').length;
    return clamp(100 - red * 15 - orange * 6);
  });

  const dimensions: HealthDimensionScore[] = [
    { key: 'budget', score: clamp(avg(budgetScores)), label: 'Budget', detail: `Avg burn ${clamp(avg(sites.map((c) => (c.budgetConsumed / c.budgetPlanned) * 100)))}%` },
    { key: 'planning', score: clamp(avg(planningScores)), label: 'Planning', detail: `Avg delay ${clamp(avg(sites.map((c) => c.delayDays)))} days` },
    { key: 'productivity', score: clamp(avg(productivityScores)), label: 'Productivity', detail: `${present}/${totalAtt} present` },
    { key: 'safety', score: clamp(avg(safetyScores)), label: 'Safety', detail: `${safetyRisks} safety flags` },
    { key: 'quality', score: clamp(avg(qualityScores)), label: 'Quality', detail: `${pendingMods} pending mods` },
    { key: 'risk', score: clamp(avg(riskScores)), label: 'Risk', detail: `${redRisks} critical, ${orangeRisks} moderate` },
  ];

  const globalScore = clamp(avg(dimensions.map((d) => d.score)));
  const level = globalScore < 50 ? 'red' : globalScore < 75 ? 'orange' : 'green';

  return { globalScore, level, dimensions };
}

export function buildFindings(snapshot: SiteDirectorSnapshot, projectId: string, projectName: string): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  const c = snapshot.chantiers.find((x) => x.id === projectId);
  if (!c) return findings;

  if (c.delayDays > 0 || c.status === 'delayed') {
    findings.push({
      category: 'delay',
      severity: c.delayDays > 10 ? 'high' : 'medium',
      title: 'Schedule delay',
      description: `${c.name}: ${c.delayDays} days behind plan, status ${c.status}.`,
      chantierId: c.id,
      chantierName: c.name,
    });
  }

  const ratio = c.budgetPlanned > 0 ? c.budgetConsumed / c.budgetPlanned : 0;
  if (ratio > 0.95) {
    findings.push({
      category: 'budget',
      severity: ratio > 1.05 ? 'high' : 'medium',
      title: 'Budget pressure',
      description: `Consumed ${(ratio * 100).toFixed(0)}% of planned budget.`,
      chantierId: c.id,
      chantierName: c.name,
    });
  }

  const criticalMats = snapshot.materials.filter(
    (m) => m.chantierId === projectId && (m.status === 'critical' || m.status === 'low')
  );
  for (const m of criticalMats.slice(0, 5)) {
    findings.push({
      category: 'material',
      severity: m.status === 'critical' ? 'high' : 'medium',
      title: 'Material shortage',
      description: `${m.name} — ${m.status} on ${m.chantierName}.`,
      chantierId: projectId,
      chantierName: projectName,
    });
  }

  const badSuppliers = snapshot.suppliers.filter((s) => s.performanceScore < 70 || s.lateDeliveries > 2);
  for (const s of badSuppliers.slice(0, 3)) {
    findings.push({
      category: 'supplier',
      severity: s.lateDeliveries > 4 ? 'high' : 'medium',
      title: 'Supplier issue',
      description: `${s.name}: score ${s.performanceScore}%, ${s.lateDeliveries} late deliveries.`,
    });
  }

  const inactive = snapshot.team.filter((t) => t.chantierId === projectId && !t.active).length;
  if (inactive > 2) {
    findings.push({
      category: 'workforce',
      severity: 'medium',
      title: 'Workforce gap',
      description: `${inactive} inactive team members on site.`,
      chantierId: projectId,
      chantierName: projectName,
    });
  }

  const blocked = snapshot.tasks.filter((t) => t.chantierId === projectId && t.status === 'blocked');
  if (blocked.length) {
    findings.push({
      category: 'productivity',
      severity: 'high',
      title: 'Blocked tasks',
      description: `${blocked.length} tasks blocked: ${blocked.map((t) => t.title).slice(0, 3).join(', ')}.`,
      chantierId: projectId,
      chantierName: projectName,
    });
  }

  const pendingMods = snapshot.modifications.filter(
    (m) => m.chantierId === projectId && m.status === 'pending'
  );
  if (pendingMods.length) {
    findings.push({
      category: 'quality',
      severity: 'medium',
      title: 'Quality / compliance',
      description: `${pendingMods.length} modifications awaiting validation.`,
      chantierId: projectId,
      chantierName: projectName,
    });
  }

  if (c.riskLevel === 'red') {
    findings.push({
      category: 'contract',
      severity: 'high',
      title: 'Contract risk',
      description: 'Critical risk level — review contract compliance and avenants.',
      chantierId: projectId,
      chantierName: projectName,
    });
  }

  return findings;
}

function planForRole(
  role: StakeholderRole,
  horizon: PlanHorizon,
  findings: AnalysisFinding[],
  c: SiteDirectorSnapshot['chantiers'][0]
): ActionPlanItem[] {
  const items: ActionPlanItem[] = [];
  const base = { role, horizon, owner: role };

  if (role === 'director' && horizon === 'daily') {
    items.push({ ...base, id: `${role}-${horizon}-1`, priority: 1, action: `Review KPI dashboard for ${c.name}`, owner: 'Director' });
  }
  if (role === 'site_manager' && horizon === 'daily') {
    items.push({ ...base, id: `${role}-${horizon}-2`, priority: 1, action: 'Morning site walk — critical zones', owner: c.manager });
    if (findings.some((f) => f.category === 'delay')) {
      items.push({ ...base, id: `${role}-${horizon}-3`, priority: 2, action: 'Update weekly schedule with delayed trades', owner: c.manager });
    }
  }
  if (role === 'procurement' && horizon === 'weekly') {
    if (findings.some((f) => f.category === 'material')) {
      items.push({ ...base, id: `${role}-${horizon}-4`, priority: 1, action: 'Issue purchase orders for critical materials', owner: 'Procurement' });
    }
  }
  if (role === 'worker' && horizon === 'daily') {
    items.push({ ...base, id: `${role}-${horizon}-5`, priority: 2, action: 'Execute priority tasks per team leader briefing', owner: 'Workers' });
  }
  if (role === 'administration' && horizon === 'monthly') {
    items.push({ ...base, id: `${role}-${horizon}-6`, priority: 3, action: 'Consolidate avenants and budget reports', owner: 'Admin' });
  }
  return items;
}

export function generateActionPlans(
  snapshot: SiteDirectorSnapshot,
  projectId: string
): ActionPlanItem[] {
  const c = snapshot.chantiers.find((x) => x.id === projectId);
  if (!c) return [];
  const findings = buildFindings(snapshot, projectId, c.name);
  const roles: StakeholderRole[] = [
    'director', 'site_manager', 'team_leader', 'worker', 'procurement', 'administration',
  ];
  const horizons: PlanHorizon[] = ['daily', 'weekly', 'monthly'];
  return roles.flatMap((role) => horizons.flatMap((h) => planForRole(role, h, findings, c)));
}

export function generateRecommendations(findings: AnalysisFinding[]): ManagementRecommendation[] {
  const recs: ManagementRecommendation[] = [];

  if (findings.some((f) => f.category === 'material')) {
    recs.push({ id: `rec_${recs.length}`, priority: 'urgent', text: 'Order materials within 48 hours.', category: 'material' });
  }
  if (findings.some((f) => f.category === 'workforce')) {
    recs.push({ id: `rec_${recs.length}`, priority: 'high', text: 'Add 2 workers to Zone A.', category: 'workforce' });
  }
  if (findings.some((f) => f.category === 'delay')) {
    recs.push({ id: `rec_${recs.length}`, priority: 'high', text: 'Reschedule electrical works.', category: 'planning' });
  }
  if (findings.some((f) => f.category === 'supplier')) {
    recs.push({ id: `rec_${recs.length}`, priority: 'high', text: 'Negotiate supplier delivery.', category: 'supplier' });
  }
  if (findings.some((f) => f.category === 'quality' || f.category === 'contract')) {
    recs.push({ id: `rec_${recs.length}`, priority: 'urgent', text: 'Increase supervision in critical area.', category: 'quality' });
  }

  return recs;
}

export function generateDecisions(findings: AnalysisFinding[]): DecisionSupport[] {
  const top = findings.find((f) => f.severity === 'high') ?? findings[0];
  if (!top) return [];

  return [
    {
      problem: top.title + ' — ' + top.description,
      options: [
        {
          id: 'opt1',
          label: 'Accelerate resources',
          description: 'Add crew and overtime on critical path',
          costImpact: 15000,
          riskLevel: 'low',
          timeImpactDays: -5,
        },
        {
          id: 'opt2',
          label: 'Reschedule downstream trades',
          description: 'Shift non-critical work to absorb delay',
          costImpact: 3000,
          riskLevel: 'medium',
          timeImpactDays: 3,
        },
        {
          id: 'opt3',
          label: 'Client change order',
          description: 'Formal extension with budget adjustment',
          costImpact: 0,
          riskLevel: 'low',
          timeImpactDays: 14,
        },
      ],
    },
  ];
}

export function predictSuccess(snapshot: SiteDirectorSnapshot, projectId: string): SuccessPrediction {
  const c = snapshot.chantiers.find((x) => x.id === projectId);
  if (!c) {
    return { onTimeProbability: 50, budgetOverrunProbability: 50, delayProbability: 50, clientSatisfactionProbability: 50 };
  }
  const health = computeHealth(snapshot, projectId);
  const ratio = c.budgetPlanned > 0 ? c.budgetConsumed / c.budgetPlanned : 0;

  const onTime = clamp(health.globalScore - c.delayDays * 2);
  const budgetOverrun = clamp(ratio > 1 ? 70 + (ratio - 1) * 100 : 30 - health.dimensions.find((d) => d.key === 'budget')!.score * 0.3);
  const delay = clamp(c.delayDays * 4 + (c.status === 'delayed' ? 25 : 0));
  const satisfaction = clamp((onTime + (100 - budgetOverrun)) / 2);

  return {
    onTimeProbability: onTime,
    budgetOverrunProbability: budgetOverrun,
    delayProbability: delay,
    clientSatisfactionProbability: satisfaction,
  };
}

export function executiveMetrics(snapshot: SiteDirectorSnapshot): ExecutiveMetrics {
  const totalPlanned = snapshot.chantiers.reduce((s, c) => s + c.budgetPlanned, 0);
  const totalConsumed = snapshot.chantiers.reduce((s, c) => s + c.budgetConsumed, 0);
  const profitability = totalPlanned > 0 ? clamp((1 - totalConsumed / totalPlanned) * 100) : 0;
  const onTrack = snapshot.chantiers.filter((c) => c.status === 'active' && c.delayDays < 5).length;
  const atRisk = snapshot.chantiers.filter((c) => c.status === 'at_risk' || c.status === 'delayed').length;
  const present = snapshot.attendance.filter((a) => a.present).length;
  const attTotal = snapshot.attendance.length || 1;
  const supplierPerf = avg(snapshot.suppliers.map((s) => s.performanceScore));
  const redRisks = snapshot.risks.filter((r) => r.level === 'red').length;

  return {
    profitabilityPercent: profitability,
    cashFlowStatus: profitability > 15 ? 'positive' : profitability > 0 ? 'neutral' : 'negative',
    projectsOnTrack: onTrack,
    projectsAtRisk: atRisk,
    workforcePerformancePercent: clamp((present / attTotal) * 100),
    supplierPerformancePercent: clamp(supplierPerf),
    riskLevel: redRisks > 3 ? 'high' : redRisks > 0 ? 'medium' : 'low',
  };
}

export function dailyBriefing(snapshot: SiteDirectorSnapshot): DailyBriefing {
  const today = new Date().toISOString().slice(0, 10);
  const delayed = snapshot.chantiers.filter((c) => c.delayDays > 0);
  const shortages = snapshot.materials.filter((m) => m.status === 'critical' || m.status === 'low');
  const blocked = snapshot.tasks.filter((t) => t.status === 'blocked');
  const alerts = snapshot.risks.filter((r) => r.level === 'red').map((r) => r.description);

  return {
    date: today,
    priorities: [
      'Validate pending modifications',
      'Confirm material deliveries for delayed sites',
      'Team leader sync at 07:30',
    ],
    urgentActions: delayed.slice(0, 3).map((c) => `Catch-up plan: ${c.name} (+${c.delayDays}d)`),
    delayedTasks: blocked.map((t) => t.title),
    materialShortages: shortages.slice(0, 6).map((m) => `${m.name} — ${m.chantierName}`),
    riskAlerts: alerts.slice(0, 5),
  };
}

export function businessCoach(snapshot: SiteDirectorSnapshot): BusinessCoachInsight[] {
  const insights: BusinessCoachInsight[] = [];
  const delayed = snapshot.chantiers.filter((c) => c.delayDays > 7).length;
  if (delayed > 0) {
    insights.push({
      id: 'coach_1',
      area: 'planning',
      title: 'Planning buffer',
      advice: 'Add 10% float on electrical and finishing trades based on past delays.',
    });
  }
  const criticalSuppliers = snapshot.suppliers.filter((s) => s.performanceScore < 75).length;
  if (criticalSuppliers > 0) {
    insights.push({
      id: 'coach_2',
      area: 'cost',
      title: 'Supplier diversification',
      advice: 'Qualify backup suppliers for tile and cement to reduce delay cost.',
    });
  }
  insights.push({
    id: 'coach_3',
    area: 'productivity',
    title: 'Daily huddle',
    advice: '15-minute morning briefing per site reduces blocked tasks.',
  });
  insights.push({
    id: 'coach_4',
    area: 'organization',
    title: 'Zone ownership',
    advice: 'Assign one team leader per zone with clear material accountability.',
  });
  insights.push({
    id: 'coach_5',
    area: 'resources',
    title: 'Resource leveling',
    advice: 'Move idle crew from completed zones to delayed zones weekly.',
  });
  return insights;
}

export function buildLearning(snapshot: SiteDirectorSnapshot): LearningInsight[] {
  return snapshot.chantiers
    .filter((c) => c.delayDays > 5 || c.progress > 80)
    .slice(0, 8)
    .map((c, i) => ({
      id: `learn_${i}`,
      type: c.delayDays > 5 ? 'delay' : 'success',
      lesson:
        c.delayDays > 5
          ? `${c.name}: delays linked to material lead times — order 2 weeks earlier next project.`
          : `${c.name}: strong progress (${c.progress}%) — replicate team structure.`,
      projectName: c.name,
      date: new Date().toISOString(),
    }));
}

export function runSiteDirectorAnalysis(
  snapshot: SiteDirectorSnapshot,
  focusProjectId?: string
): SiteDirectorAnalysis {
  const projectId = focusProjectId ?? snapshot.chantiers[0]?.id ?? '';
  const projectName = snapshot.chantiers.find((c) => c.id === projectId)?.name ?? 'Portfolio';

  const health = computeHealth(snapshot, focusProjectId);
  const reports: ProjectAnalysisReport[] = (focusProjectId
    ? [focusProjectId]
    : snapshot.chantiers.map((c) => c.id)
  ).map((id) => {
    const name = snapshot.chantiers.find((c) => c.id === id)?.name ?? id;
    const findings = buildFindings(snapshot, id, name);
    return {
      projectId: id,
      projectName: name,
      generatedAt: new Date().toISOString(),
      findings,
      summary: `${findings.length} findings — ${findings.filter((f) => f.severity === 'high').length} critical.`,
    };
  });

  const findings = buildFindings(snapshot, projectId, projectName);

  return {
    health,
    reports,
    actionPlans: generateActionPlans(snapshot, projectId),
    recommendations: generateRecommendations(findings),
    decisions: generateDecisions(findings),
    predictions: predictSuccess(snapshot, projectId),
    executive: executiveMetrics(snapshot),
    briefing: dailyBriefing(snapshot),
    coach: businessCoach(snapshot),
    learning: buildLearning(snapshot),
  };
}
