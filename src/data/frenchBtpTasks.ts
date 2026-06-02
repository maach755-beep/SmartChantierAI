import type { BtpTaskLot, Chantier, Room, Task, TaskPriority, TaskStatus } from '@/types';

/** Tâches réalistes second œuvre / finitions — France, sans doublons massifs. */
const LOT_TASKS: Record<BtpTaskLot, { title: string; roomHint: string }[]> = {
  carrelage: [
    { title: 'Préparation support et pose carrelage sol', roomHint: 'Séjour' },
    { title: 'Carrelage mural pièces humides (DTU 52.2)', roomHint: 'Salle de bain' },
    { title: 'Jointement et protection carrelage', roomHint: 'Cuisine' },
  ],
  peinture: [
    { title: 'Préparation supports et peinture acrylique mate', roomHint: 'Chambres' },
    { title: 'Peinture cages d\'escalier et parties communes', roomHint: 'Circulation' },
    { title: 'Finition laque boiserie et plinthes', roomHint: 'Salon' },
  ],
  plomberie: [
    { title: 'Réseau EF/ECS — distribution sanitaires', roomHint: 'SDB' },
    { title: 'Pose appareils sanitaires et raccordements', roomHint: 'Salle de bain' },
    { title: 'Étanchéité et test pression réseau', roomHint: 'Local technique' },
  ],
  electricite: [
    { title: 'Gaine technique et tirage câbles logements', roomHint: 'Couloir' },
    { title: 'Pose tableaux divisionnaires et équipotentialité', roomHint: 'Local élec' },
    { title: 'Appareillage et tests continuité (NF C 15-100)', roomHint: 'Pièces à vivre' },
  ],
  cloisons: [
    { title: 'Cloisons BA13 sur ossature métallique', roomHint: 'Bureaux' },
    { title: 'Doublage isolant et parements hydrofuges', roomHint: 'SDB' },
    { title: 'Calfeutrement et reprises acoustiques', roomHint: 'Chambre 1' },
  ],
  faux_plafond: [
    { title: 'Ossature et dalles acoustiques open space', roomHint: 'Open space' },
    { title: 'Faux plafond hydrofuge zones humides', roomHint: 'SDB' },
    { title: 'Intégration spots et trappes de visite', roomHint: 'Hall' },
  ],
  menuiserie: [
    { title: 'Pose menuiseries intérieures bois', roomHint: 'Chambres' },
    { title: 'Réglage portes et quincaillerie', roomHint: 'Circulation' },
    { title: 'Placards et finitions bois', roomHint: 'Dressing' },
  ],
  nettoyage: [
    { title: 'Nettoyage fin chantier — retrait poussières', roomHint: 'Ensemble' },
    { title: 'Lavage vitrages et reprises de surface', roomHint: 'Façade vitrée' },
  ],
  reception: [
    { title: 'Préparation dossier OPR / réserves', roomHint: 'Ensemble' },
    { title: 'Réception client — levée des réserves', roomHint: 'Ensemble' },
  ],
};

const LOT_ORDER: BtpTaskLot[] = [
  'cloisons',
  'electricite',
  'plomberie',
  'faux_plafond',
  'carrelage',
  'peinture',
  'menuiserie',
  'nettoyage',
  'reception',
];

const STATUS_ROTATION: TaskStatus[] = [
  'todo',
  'in_progress',
  'waiting',
  'blocked',
  'done',
  'validated',
  'in_progress',
  'todo',
];

const PRIORITY_ROTATION: TaskPriority[] = [
  'medium',
  'high',
  'low',
  'critical',
  'high',
  'medium',
  'low',
];

const COST_BY_LOT_HT: Record<BtpTaskLot, [number, number]> = {
  carrelage: [4_200, 18_500],
  peinture: [2_800, 12_000],
  plomberie: [3_500, 22_000],
  electricite: [4_000, 28_000],
  cloisons: [3_200, 15_000],
  faux_plafond: [2_500, 14_000],
  menuiserie: [3_800, 19_000],
  nettoyage: [800, 4_500],
  reception: [500, 2_500],
};

function pickRoom(rooms: Room[], hint: string, index: number): Room | undefined {
  const byHint = rooms.find((r) => r.name.toLowerCase().includes(hint.toLowerCase().split(' ')[0] ?? ''));
  return byHint ?? rooms[index % rooms.length];
}

function estimateCost(lot: BtpTaskLot, chantierIndex: number, taskIndex: number): number {
  const [min, max] = COST_BY_LOT_HT[lot];
  const span = max - min;
  const ratio = ((chantierIndex * 7 + taskIndex * 13) % 100) / 100;
  return Math.round(min + span * ratio);
}

function dueDateFor(chantier: Chantier, offsetDays: number): string {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays + (chantier.delayDays > 0 ? 3 : 0));
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Génère un jeu de tâches BTP France cohérent par chantier (pas de boucle 100× répétitive).
 */
export function buildFrenchBtpTasks(
  chantiers: Chantier[],
  rooms: Room[],
  assignees: string[]
): Task[] {
  const tasks: Task[] = [];
  let globalIndex = 0;

  chantiers.forEach((ch, ci) => {
    const chRooms = rooms.filter((r) => r.chantierId === ch.id);
    const fallbackRoom = chRooms[0];
    const manager = ch.manager || assignees[ci % assignees.length];
    const engineer = ch.engineer ?? assignees[(ci + 2) % assignees.length];

    LOT_ORDER.forEach((lot, lotIndex) => {
      const definitions = LOT_TASKS[lot];
      const def = definitions[ci % definitions.length];
      const room = pickRoom(chRooms, def.roomHint, lotIndex) ?? fallbackRoom;
      const assignee =
        lot === 'electricite' || lot === 'plomberie'
          ? engineer
          : lot === 'reception' || lot === 'nettoyage'
            ? manager
            : assignees[(ci + lotIndex) % assignees.length];

      tasks.push({
        id: `task_${ch.id}_${lot}`,
        chantierId: ch.id,
        chantierName: ch.name,
        roomId: room?.id ?? `room_${ch.id}_0`,
        roomName: room?.name ?? def.roomHint,
        title: def.title,
        lot,
        status: STATUS_ROTATION[(ci + lotIndex) % STATUS_ROTATION.length],
        assignee,
        priority: PRIORITY_ROTATION[(ci + lotIndex) % PRIORITY_ROTATION.length],
        dueDate: dueDateFor(ch, 7 + lotIndex * 9 + ci * 2),
        estimatedCostHt: estimateCost(lot, ci, lotIndex),
      });
      globalIndex += 1;
    });
  });

  void globalIndex;
  return tasks;
}
