import { dataStore } from '@/services/dataStore';
import type { SiteDirectorSnapshot } from '@shared/site-director/types';

export function buildSnapshotFromStore(): SiteDirectorSnapshot {
  dataStore.init();
  return {
    chantiers: dataStore.getChantiers().map((c) => ({
      id: c.id,
      name: c.name,
      client: c.client,
      status: c.status,
      progress: c.progress,
      delayDays: c.delayDays,
      budgetPlanned: c.budgetPlanned,
      budgetConsumed: c.budgetConsumed,
      riskLevel: c.riskLevel,
      manager: c.manager,
    })),
    risks: dataStore.getRisks().map((r) => ({
      id: r.id,
      chantierId: r.chantierId,
      chantierName: r.chantierName,
      type: r.type,
      level: r.level,
      score: r.score,
      description: r.description,
    })),
    materials: dataStore.getMaterials().map((m) => ({
      id: m.id,
      chantierId: m.chantierId,
      chantierName: m.chantierName,
      name: m.name,
      status: m.status,
    })),
    suppliers: dataStore.getSuppliers().map((s) => ({
      id: s.id,
      name: s.name,
      performanceScore: s.performanceScore,
      lateDeliveries: s.lateDeliveries,
      pendingMaterials: s.pendingMaterials,
    })),
    tasks: dataStore.getTasks().map((t) => ({
      id: t.id,
      chantierId: t.chantierId,
      title: t.title,
      status: t.status,
    })),
    team: dataStore.getTeam().map((m) => ({
      id: m.id,
      chantierId: m.chantierId,
      name: m.name,
      active: m.active,
      roleType: m.roleType,
    })),
    attendance: dataStore.getAttendance().map((a) => ({
      present: a.present,
      absent: a.absent,
      chantierId: a.chantierId,
    })),
    modifications: dataStore.getModifications().map((m) => ({
      id: m.id,
      chantierId: m.chantierId,
      status: m.status,
      budgetImpact: m.budgetImpact,
    })),
    materialRequests: dataStore.getMaterialRequests().map((r) => ({
      status: r.status,
      urgency: r.urgency,
      chantierName: r.chantierName,
      materialName: r.materialName,
    })),
  };
}
