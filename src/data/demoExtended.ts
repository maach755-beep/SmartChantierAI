import type { AppNotification, Document, MaterialRequest, TimelineEvent } from '@/types';
import { demoChantiers, demoTasks } from './demoData';

export const demoTimeline: TimelineEvent[] = demoChantiers.flatMap((c, ci) => [
  {
    id: `tl_${c.id}_1`,
    chantierId: c.id,
    date: c.startDate,
    title: 'Démarrage chantier',
    type: 'milestone',
    status: 'done',
  },
  {
    id: `tl_${c.id}_2`,
    chantierId: c.id,
    date: `2026-0${5 + (ci % 2)}-15`,
    title: demoTasks.find((t) => t.chantierId === c.id && t.status === 'in_progress')?.title ?? 'Travaux en cours',
    type: 'task',
    status: c.status === 'delayed' ? 'late' : 'pending',
  },
  {
    id: `tl_${c.id}_3`,
    chantierId: c.id,
    date: c.endDate,
    title: 'Livraison prévue',
    type: 'milestone',
    status: c.progress > 80 ? 'pending' : 'late',
  },
]);

export const demoDocuments: Document[] = [
  ...demoChantiers.slice(0, 5).map((c, i) => ({
    id: `doc_plan_${i}`,
    name: `Plan architectural — ${c.name}.pdf`,
    type: 'plan' as const,
    chantierId: c.id,
    chantierName: c.name,
    size: `${2.4 + i * 0.3} Mo`,
    uploadedBy: c.manager,
    date: c.startDate,
    tags: ['plan', 'architecture'],
  })),
  ...demoChantiers.slice(0, 4).map((c, i) => ({
    id: `doc_contract_${i}`,
    name: `Contrat MOA — ${c.client}.pdf`,
    type: 'pdf' as const,
    chantierId: c.id,
    chantierName: c.name,
    size: `${1.1 + i * 0.2} Mo`,
    uploadedBy: 'Bureau études',
    date: c.startDate,
    tags: ['contrat', 'legal'],
  })),
  ...demoChantiers.slice(0, 6).map((c, i) => ({
    id: `doc_photo_${i}`,
    name: `Rapport photo ${i + 1} — ${c.name}.jpg`,
    type: 'photo' as const,
    chantierId: c.id,
    chantierName: c.name,
    url: `https://picsum.photos/seed/doc${i}/400/300`,
    size: '850 Ko',
    uploadedBy: c.manager,
    date: `2026-05-${String(10 + i).padStart(2, '0')}`,
    tags: ['photo', 'terrain'],
  })),
];

export const demoMaterialRequests: MaterialRequest[] = Array.from({ length: 15 }, (_, i) => {
  const c = demoChantiers[i % demoChantiers.length];
  const statuses: MaterialRequest['status'][] = ['pending', 'approved', 'delivered', 'rejected'];
  return {
    id: `mreq_${i + 1}`,
    chantierId: c.id,
    chantierName: c.name,
    materialName: ['Ciment CPJ45', 'Carrelage 60x60', 'Colle flexible', 'Peinture mate', 'Parquet chêne'][i % 5],
    quantity: 20 + i * 5,
    unit: i % 2 === 0 ? 'sac' : 'm²',
    requestedBy: c.manager,
    date: `2026-05-${String(20 + (i % 8)).padStart(2, '0')}`,
    status: statuses[i % 4],
    urgency: i % 3 === 0 ? 'urgent' : 'normal',
  };
});

export const demoNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'delay',
    title: 'Retard chantier',
    message: 'Tour Zerktouni — retard 14 jours sur planning',
    chantierId: 'ch_2',
    chantierName: 'Tour Zerktouni',
    date: new Date().toISOString(),
    read: false,
    level: 'orange',
  },
  {
    id: 'notif_2',
    type: 'risk',
    title: 'Risque critique',
    message: 'Complexe Garonne — dépassement budget + tâches bloquées',
    chantierId: 'ch_4',
    chantierName: 'Complexe Garonne',
    date: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    level: 'red',
  },
  {
    id: 'notif_3',
    type: 'material',
    title: 'Matériaux manquants',
    message: 'Résidence Les Lilas — carrelage 60x60 stock critique',
    chantierId: 'ch_1',
    chantierName: 'Résidence Les Lilas',
    date: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    level: 'orange',
  },
  {
    id: 'notif_4',
    type: 'photo',
    title: 'Nouvelle photo terrain',
    message: 'Villa Méditerranée — 3 photos uploadées par chef de chantier',
    chantierId: 'ch_3',
    chantierName: 'Villa Méditerranée',
    date: new Date(Date.now() - 1800000).toISOString(),
    read: true,
    level: 'green',
  },
  {
    id: 'notif_5',
    type: 'project',
    title: 'Projet mis à jour',
    message: 'Immeuble Haussmann — progression 67%',
    chantierId: 'ch_5',
    chantierName: 'Immeuble Haussmann',
    date: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    level: 'green',
  },
  {
    id: 'notif_6',
    type: 'material',
    title: 'Demande matériaux',
    message: 'Entrepôt Vénissieux — demande ciment urgente en attente',
    chantierId: 'ch_7',
    chantierName: 'Entrepôt Vénissieux',
    date: new Date().toISOString(),
    read: false,
    level: 'red',
  },
];
