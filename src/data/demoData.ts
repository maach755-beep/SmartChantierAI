import { buildFrenchBtpTasks } from '@/data/frenchBtpTasks';
import type {
  AttendanceRecord,
  Chantier,
  FieldUpdate,
  FlooringRow,
  Modification,
  PlanRoom,
  PlanningTask,
  Risk,
  Room,
  Supplier,
  Task,
  Worker,
} from '@/types';

const siteNames = [
  'Résidence Les Lilas',
  'Tour Part-Dieu',
  'Villa Méditerranée',
  'Complexe Garonne',
  'Immeuble Haussmann',
  'Résidence Parc Sud',
  'Entrepôt Vénissieux',
  'Bureaux Euratlantique',
  'Usine Normandie',
  'Centre Lille Europe',
];

const clients = [
  'Promoteur Île-de-France',
  'Groupe Immobilier Lyon',
  'Société Provence BTP',
  'BTP Horizon France',
  'Résidences du Parc',
  'Villa Prestige',
  'Entreprise Batipro',
  'Construct Plus',
  'Habitat Moderne',
  'Les Jardins Urbains',
];

const managers = [
  'Pierre Martin',
  'Jean Dupont',
  'Marc Lefebvre',
  'Thomas Bernard',
  'Nicolas Petit',
  'Julien Moreau',
  'François Girard',
  'Antoine Roux',
  'Laurent Simon',
  'Philippe Michel',
];

const addresses = [
  '12 Rue de la République, 75011 Paris',
  '45 Cours Lafayette, 69003 Lyon',
  '8 ZAC Grand Large, 33000 Bordeaux',
  '23 Avenue Jean Jaurès, 31000 Toulouse',
  '67 Boulevard Haussmann, 75008 Paris',
  '3 Rue Nationale, 13001 Marseille',
  '91 Rue de la Gare, 69150 Vénissieux',
  '14 Quai des Chartrons, 33000 Bordeaux',
  '56 Avenue de la Liberté, 59000 Lille',
  '29 Rue Faidherbe, 59800 Lille',
];

const riskDescriptions = [
  'Dépassement budget prévisionnel de 8% — lot carrelage',
  'Retard livraison acier — impact structure R+1',
  'Manque carrelage 60x60 — 120 m² non commandés',
  'Tâche plomberie SDB bloquée — attente validation',
  'Effectif insuffisant équipe 2 (3 absents)',
  'Fournisseur Carrelage Express — 5 j de retard',
  'Non-conformité cloison cuisine vs plan initial',
  'Humidité détectée zone SDB — risque étanchéité',
  'Avenant client non validé — impact planning',
  'Surcharge planning équipe menuiserie',
];

export const demoChantiers: Chantier[] = Array.from({ length: 10 }, (_, i) => {
  const progress = 22 + i * 7 + (i % 3) * 4;
  const budgetPlanned = 850000 + i * 135000;
  const budgetConsumed = Math.round(budgetPlanned * (progress / 100) * (0.88 + (i % 4) * 0.04));
  const statuses: Chantier['status'][] = [
    'active',
    'active',
    'delayed',
    'at_risk',
    'active',
    'delayed',
    'active',
    'at_risk',
    'active',
    'completed',
  ];
  const risks: Chantier['riskLevel'][] = [
    'green',
    'green',
    'orange',
    'red',
    'green',
    'orange',
    'green',
    'red',
    'green',
    'green',
  ];
  const delayDays =
    statuses[i] === 'delayed' ? 10 + i * 2 : statuses[i] === 'at_risk' ? 5 + i : i % 4;
  return {
    id: `ch_${i + 1}`,
    name: siteNames[i],
    client: clients[i],
    address: addresses[i],
    manager: managers[i],
    startDate: `2025-${String(1 + (i % 6)).padStart(2, '0')}-15`,
    endDate: `2026-${String(6 + (i % 5)).padStart(2, '0')}-30`,
    budgetPlanned,
    budgetConsumed,
    progress: Math.min(progress, 98),
    delayDays,
    riskLevel: risks[i],
    status: statuses[i],
  };
});

const roomNames = ['Salon', 'Cuisine', 'Chambre 1', 'Chambre 2', 'SDB', 'Hall', 'Bureau', 'Terrasse'];

export const demoRooms: Room[] = demoChantiers.flatMap((c) =>
  roomNames.slice(0, 4 + (parseInt(c.id.split('_')[1], 10) % 3)).map((name, ri) => ({
    id: `room_${c.id}_${ri}`,
    chantierId: c.id,
    name,
    tasks: [],
    materials: ['Carrelage grès 60x60', 'Peinture mate RAL 9010', 'Parquet chêne'].slice(0, 1 + (ri % 3)),
    photos: [],
    notes: ri === 0 ? 'Contrôle qualité OK' : '',
  }))
);

export const demoTasks: Task[] = buildFrenchBtpTasks(demoChantiers, demoRooms, managers);

const trades = ['Maçon', 'Électricien', 'Plombier', 'Carreleur', 'Peintre', 'Menuisier', 'Manœuvre', 'Chef équipe'];

const firstNames = [
  'Pierre', 'Jean', 'Marc', 'Thomas', 'Nicolas', 'Julien', 'François', 'Antoine', 'Laurent', 'Philippe',
  'Luc', 'Hugo', 'Étienne', 'Baptiste', 'Maxime', 'Clément', 'Alexandre', 'Damien', 'Sébastien', 'Romain',
  'Vincent', 'Guillaume', 'Olivier', 'Mathieu', 'Benjamin',
];
const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy',
  'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux',
];

export const demoWorkers: Worker[] = Array.from({ length: 50 }, (_, i) => ({
  id: `w_${i + 1}`,
  name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
  trade: trades[i % trades.length],
  chantierId: demoChantiers[i % 10].id,
  phone: `+33 6 ${String(10 + (i % 80)).padStart(2, '0')} ${String(100000 + i * 137).slice(0, 2)} ${String(100000 + i * 137).slice(2, 4)} ${String(100000 + i * 137).slice(4, 6)}`,
}));

export const demoRisks: Risk[] = Array.from({ length: 30 }, (_, i) => {
  const ch = demoChantiers[i % 10];
  const types = [
    'budget_overrun',
    'delay',
    'material_shortage',
    'blocked_task',
    'labor_shortage',
    'supplier_delay',
    'contract_breach',
  ];
  const levels: Risk['level'][] = ['green', 'orange', 'red'];
  const level = levels[i % 3];
  return {
    id: `risk_${i + 1}`,
    chantierId: ch.id,
    chantierName: ch.name,
    type: types[i % types.length],
    description: riskDescriptions[i % riskDescriptions.length],
    level,
    score: level === 'red' ? 75 + (i % 20) : level === 'orange' ? 45 + (i % 25) : 15 + (i % 20),
    detectedAt: `2026-05-${String(1 + (i % 28)).padStart(2, '0')}`,
  };
});

const modTitles = [
  'Extension cuisine +4 m²',
  'Changement carrelage salon 80x80',
  'Ajout cloison bureau',
  'Modification SDB — douche italienne',
  'Renfort structure terrasse',
  'Remplacement menuiseries aluminium',
  'Ajout VMC cuisine',
  'Modification hauteur plafond hall',
];

export const demoModifications: Modification[] = Array.from({ length: 20 }, (_, i) => {
  const ch = demoChantiers[i % 10];
  const modStatuses: Modification['status'][] = ['draft', 'pending', 'approved', 'rejected'];
  return {
    id: `mod_${i + 1}`,
    chantierId: ch.id,
    chantierName: ch.name,
    title: `AV-${String(i + 1).padStart(3, '0')} — ${modTitles[i % modTitles.length]}`,
    description: `Demande de modification ${i + 1} transmise par le maître d'ouvrage. Impact technique validé par bureau d'études.`,
    reason: ['Demande client', 'Contrainte technique', 'Erreur plan', 'Optimisation coût'][i % 4],
    room: roomNames[i % roomNames.length],
    materials: 'Carrelage premium 80x80 — Porcelanosa',
    oldQty: 45 + i,
    newQty: 52 + i,
    budgetImpact: 4800 + i * 920,
    delayImpact: i % 6,
    status: modStatuses[i % 4],
    photos: [],
    createdAt: `2026-04-${String(5 + (i % 20)).padStart(2, '0')}`,
    history: [
      { date: `2026-04-${String(5 + (i % 20)).padStart(2, '0')}`, action: 'Création', user: managers[i % managers.length] },
      { date: `2026-04-${String(8 + (i % 15)).padStart(2, '0')}`, action: 'Soumission MOA', user: 'Bureau études' },
    ],
  };
});

export const demoSuppliers: Supplier[] = [
  { name: 'Matériaux Pro BTP', materials: ['Ciment', 'Sable', 'Gravier'] },
  { name: 'Carrelage Express', materials: ['Carrelage', 'Colle', 'Joint'] },
  { name: 'Électricité Pro France', materials: ['Câbles', 'Tableaux', 'Appareillage'] },
  { name: 'Plomberie Centrale', materials: ['Tubes PVC', 'Robinetterie', 'Sanitaires'] },
  { name: 'Bois & Menuiserie', materials: ['Bois', 'Portes', 'Placards'] },
  { name: 'Peintures Atlas', materials: ['Peinture', 'Enduit', 'Primaire'] },
  { name: 'Ciment National', materials: ['Ciment CPJ45', 'Chaux'] },
  { name: 'Isolation Plus', materials: ['Laine de roche', 'Polystyrène'] },
  { name: 'Sanitaire Moderne', materials: ['Douches', 'Lavabos', 'WC'] },
  { name: 'Quincaillerie Chantier', materials: ['Vis', 'Chevilles', 'Outillage'] },
  { name: 'Béton Ready', materials: ['Béton prêt', 'Fibres'] },
  { name: 'Acier Construction', materials: ['Poutrelles', 'Treillis'] },
  { name: 'Revêtements Sol', materials: ['Parquet', 'Résine', 'Moquette'] },
  { name: 'Faux Plafonds Pro', materials: ['Dalles', 'Ossature'] },
  { name: 'Outillage BTP', materials: ['Échafaudage', 'Bennes'] },
].map((s, i) => ({
  id: `sup_${i + 1}`,
  name: s.name,
  contact: `${['Pierre', 'Jean', 'Marie', 'Sophie'][i % 4]} ${lastNames[i % lastNames.length]}`,
  phone: `+33 1 ${40 + (i % 5)} ${String(100000 + i * 1111).slice(0, 2)} ${String(100000 + i * 1111).slice(2, 4)} ${String(100000 + i * 1111).slice(4, 6)}`,
  email: `contact@${s.name.toLowerCase().replace(/\s+/g, '')}.fr`,
  address: `${10 + i} ZAC des Portes de Paris, 93000 Bobigny`,
  materials: s.materials,
  ordersCount: 14 + i * 4,
  lateDeliveries: i % 5,
  pendingMaterials: i % 7,
  performanceScore: Math.max(52, 96 - i * 3 - (i % 3) * 4),
}));

export const demoPlanRooms: PlanRoom[] = Array.from({ length: 14 }, (_, i) => ({
  id: `plan_${i + 1}`,
  piece: roomNames[i % roomNames.length],
  surface: 14.5 + i * 3.2,
  material: ['Carrelage grès', 'Parquet chêne', 'Marbre blanc', 'Moquette bureau'][i % 4],
  brand: ['Marazzi', 'Porcelanosa', 'Quick-Step', 'Forbo'][i % 4],
  model: `REF-2026-${1000 + i}`,
  quantity: Math.ceil(14.5 + i * 3.2),
  observation: i % 3 === 0 ? 'Légende S1 — zone séjour' : i % 3 === 1 ? 'Légende S2 — chambres' : 'Légende S3 — pièces techniques',
}));

export const demoFlooring: FlooringRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `floor_${i + 1}`,
  num: i + 1,
  zone: `Zone ${String.fromCharCode(65 + (i % 6))}`,
  color: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
  surface: 16 + i * 4.5,
  designation: ['Carrelage grès cérame 60x60', 'Parquet stratifié chêne', 'Résine époxy garage', 'Marbre poli hall'][i % 4],
  brand: demoPlanRooms[i % 14].brand,
  model: demoPlanRooms[i % 14].model,
  quantity: Math.ceil(16 + i * 4.5),
  observation: `Légende S${(i % 3) + 1}`,
}));

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const demoAttendance: AttendanceRecord[] = demoWorkers.flatMap((w, wi) =>
  weekDays.slice(0, 5).map((_, di) => {
    const ch = demoChantiers.find((c) => c.id === w.chantierId)!;
    const present = (wi + di) % 6 !== 0;
    const sick = (wi + di) % 17 === 0;
    const leave = (wi + di) % 23 === 0;
    const absent = !present && !sick && !leave;
    return {
      id: `att_${w.id}_d${di}`,
      workerId: w.id,
      workerName: w.name,
      chantierId: ch.id,
      chantierName: ch.name,
      date: `2026-05-${String(26 + di).padStart(2, '0')}`,
      present,
      absent,
      sick,
      leave,
      hoursWorked: present ? (sick || leave ? 0 : 8) : 0,
    };
  })
);

const fieldContents = [
  'Photo avancement cuisine — carrelage en cours',
  'Retard constaté livraison colle carrelage',
  'Manque 40 sacs ciment CPJ45',
  'Modification cloison signalée zone salon',
  'Pointage équipe 12 présents / 2 absents',
  'Commentaire chef : pluie — arrêt terrasse',
];

export const demoFieldUpdates: FieldUpdate[] = Array.from({ length: 12 }, (_, i) => {
  const ch = demoChantiers[i % 8];
  const types: FieldUpdate['type'][] = ['photo', 'modification', 'delay', 'material', 'attendance', 'comment'];
  const statuses: FieldUpdate['status'][] = ['pending', 'pending', 'validated', 'rejected', 'clarification', 'pending'];
  return {
    id: `field_${i + 1}`,
    chantierId: ch.id,
    chantierName: ch.name,
    sender: ch.manager,
    date: new Date(Date.now() - i * 7200000).toISOString(),
    type: types[i % types.length],
    content: fieldContents[i % fieldContents.length],
    photoUrl: i % 3 !== 2 ? `https://picsum.photos/seed/sc${i}/480/320` : undefined,
    status: statuses[i % statuses.length],
    aiAnalysis: {
      modificationDetected: i % 2 === 0,
      affectedRoom: roomNames[i % roomNames.length],
      budgetImpact: 1800 + i * 620,
      delayImpact: i % 4,
      materialImpact: 'Carrelage 60x60 — écart quantité détecté',
      riskImpact: (['green', 'orange', 'red'] as const)[i % 3],
    },
  };
});

const planningTitles = [
  'Cloisons BA13',
  'Électricité — tirage câbles',
  'Plomberie sanitaires',
  'Faux plafond dalles',
  'Carrelage sol',
];

export const demoPlanning: PlanningTask[] = demoChantiers.slice(0, 8).flatMap((c, ci) =>
  planningTitles.map((title, ti) => ({
    id: `plan_task_${ci}_${ti}`,
    chantierId: c.id,
    title: `${title}`,
    start: `2026-0${5 + (ti % 2)}-${String(1 + ti * 4).padStart(2, '0')}`,
    end: `2026-0${5 + (ti % 2)}-${String(12 + ti * 4).padStart(2, '0')}`,
    team: `Équipe ${(ti % 3) + 1}`,
    progress: Math.min(95, 15 + ti * 14 + ci * 3),
    dependencies: ti > 0 ? [`plan_task_${ci}_${ti - 1}`] : undefined,
  }))
);

export const chartProgressData = demoChantiers.map((c) => ({
  name: c.name.length > 12 ? c.name.slice(0, 11) + '…' : c.name,
  progress: c.progress,
  budget: Math.round((c.budgetConsumed / c.budgetPlanned) * 100),
}));

export const chartRiskData = [
  { name: 'Vert', value: demoRisks.filter((r) => r.level === 'green').length, fill: '#22c55e' },
  { name: 'Orange', value: demoRisks.filter((r) => r.level === 'orange').length, fill: '#f59e0b' },
  { name: 'Rouge', value: demoRisks.filter((r) => r.level === 'red').length, fill: '#ef4444' },
];

export const chartBudgetData = demoChantiers.slice(0, 8).map((c) => ({
  name: c.name.length > 10 ? c.name.slice(0, 9) + '…' : c.name,
  prevu: Math.round(c.budgetPlanned / 1000),
  consomme: Math.round(c.budgetConsumed / 1000),
}));

export const chartDelayData = demoChantiers.map((c) => ({
  name: c.name.length > 8 ? c.name.slice(0, 7) + '…' : c.name,
  retard: c.delayDays,
}));

export const chartPresenceData = weekDays.slice(0, 6).map((day, di) => {
  const base = demoAttendance.filter((a) => a.date.endsWith(String(26 + di).padStart(2, '0')));
  const present = base.filter((a) => a.present).length;
  const absent = base.filter((a) => a.absent || a.sick || a.leave).length;
  return { day, present: present || 38 + di, absent: absent || 6 - di };
});
