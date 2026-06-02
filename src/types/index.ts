export type Lang = 'fr' | 'ar' | 'en';

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'blocked' | 'done' | 'validated';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Lots métiers second œuvre — marché France. */
export type BtpTaskLot =
  | 'carrelage'
  | 'peinture'
  | 'plomberie'
  | 'electricite'
  | 'cloisons'
  | 'faux_plafond'
  | 'menuiserie'
  | 'nettoyage'
  | 'reception';
export type ModificationStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type RiskLevel = 'green' | 'orange' | 'red';
export type FinancialStatus = 'profitable' | 'watch' | 'unprofitable';
export type ProjectStatus = 'active' | 'delayed' | 'at_risk' | 'completed';
export type TeamRoleType = 'worker' | 'site_manager' | 'engineer';
export type DocumentType = 'pdf' | 'plan' | 'photo' | 'other';
export type NotificationType = 'delay' | 'risk' | 'material' | 'photo' | 'project' | 'system';
export type MaterialRequestStatus = 'pending' | 'approved' | 'delivered' | 'rejected';

export interface Chantier {
  id: string;
  name: string;
  client: string;
  address: string;
  manager: string;
  engineer?: string;
  startDate: string;
  endDate: string;
  budgetPlanned: number;
  budgetConsumed: number;
  progress: number;
  delayDays: number;
  riskLevel: RiskLevel;
  status: ProjectStatus;
  description?: string;
}

export interface TimelineEvent {
  id: string;
  chantierId: string;
  date: string;
  title: string;
  type: 'milestone' | 'delay' | 'task' | 'delivery' | 'inspection';
  status: 'done' | 'pending' | 'late';
}

export interface Task {
  id: string;
  chantierId: string;
  chantierName?: string;
  roomId: string;
  roomName?: string;
  title: string;
  lot: BtpTaskLot;
  status: TaskStatus;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  /** Coût prévisionnel lot (€ HT). */
  estimatedCostHt: number;
}

export interface TeamMember {
  id: string;
  name: string;
  trade: string;
  role: string;
  roleType: TeamRoleType;
  team: string;
  chantierId: string;
  chantierName: string;
  phone: string;
  email?: string;
  active: boolean;
  hoursThisWeek: number;
}

export type MaterialStockStatus = 'ok' | 'low' | 'critical' | 'ordered';

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantityRequired: number;
  quantityOnSite: number;
  quantityOrdered: number;
  chantierId: string;
  chantierName: string;
  supplierName: string;
  status: MaterialStockStatus;
}

export interface MaterialRequest {
  id: string;
  chantierId: string;
  chantierName: string;
  materialName: string;
  quantity: number;
  unit: string;
  requestedBy: string;
  date: string;
  status: MaterialRequestStatus;
  urgency: 'normal' | 'urgent';
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  chantierId: string;
  chantierName: string;
  url?: string;
  size: string;
  uploadedBy: string;
  date: string;
  tags: string[];
}

export type PhotoPhase = 'before' | 'after' | 'progress';

export interface SitePhoto {
  id: string;
  chantierId: string;
  chantierName: string;
  albumId?: string;
  room: string;
  url: string;
  caption?: string;
  phase: PhotoPhase;
  uploadedBy: string;
  date: string;
  tags: string[];
  fileSize?: string;
}

export interface PhotoAlbum {
  id: string;
  name: string;
  chantierId: string;
  chantierName: string;
  description: string;
  coverPhotoId?: string;
  photoIds: string[];
  createdAt: string;
}

export interface PhotoComparisonResult {
  progressDetected: string[];
  delayDetected: string[];
  materialChangeDetected: string[];
  modificationsDetected: string[];
  completedWork: string[];
  missingWork: string[];
  alerts: string[];
  differenceScore: number;
}

export interface PhotoComparisonRecord {
  id: string;
  chantierId: string;
  chantierName: string;
  oldPhotoId: string;
  newPhotoId: string;
  oldPhotoUrl: string;
  newPhotoUrl: string;
  date: string;
  result: PhotoComparisonResult;
}

export interface PhotoTimelineEntry {
  id: string;
  chantierId: string;
  date: string;
  title: string;
  photoId: string;
  photoUrl: string;
  phase: PhotoPhase;
  type: 'upload' | 'comparison' | 'milestone';
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  chantierId?: string;
  chantierName?: string;
  date: string;
  read: boolean;
  level: RiskLevel;
}

export interface AiAnalysisResult {
  modifications: string[];
  delays: string[];
  missingWork: string[];
  recommendations: string[];
  progressDetected: string[];
  materialChanges: string[];
  complianceScore: number;
}

export interface Room {
  id: string;
  chantierId: string;
  name: string;
  tasks: Task[];
  materials: string[];
  photos: string[];
  notes: string;
}

export interface Worker {
  id: string;
  name: string;
  trade: string;
  chantierId: string;
  phone?: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  chantierId: string;
  chantierName: string;
  date: string;
  present: boolean;
  absent: boolean;
  sick: boolean;
  leave: boolean;
  hoursWorked: number;
}

export interface Risk {
  id: string;
  chantierId: string;
  chantierName: string;
  type: string;
  description: string;
  level: RiskLevel;
  score: number;
  detectedAt: string;
}

export interface Modification {
  id: string;
  chantierId: string;
  chantierName: string;
  title: string;
  description: string;
  reason: string;
  room: string;
  materials: string;
  oldQty: number;
  newQty: number;
  budgetImpact: number;
  delayImpact: number;
  status: ModificationStatus;
  photos: string[];
  createdAt: string;
  history: { date: string; action: string; user: string }[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  materials: string[];
  ordersCount: number;
  lateDeliveries: number;
  pendingMaterials: number;
  performanceScore: number;
}

export interface PlanRoom {
  id: string;
  piece: string;
  surface: number;
  material: string;
  brand: string;
  model: string;
  quantity: number;
  observation: string;
}

export interface FlooringRow {
  id: string;
  num: number;
  zone: string;
  color: string;
  surface: number;
  designation: string;
  brand: string;
  model: string;
  quantity: number;
  observation: string;
}

export interface FieldUpdate {
  id: string;
  chantierId: string;
  chantierName: string;
  sender: string;
  date: string;
  type: 'photo' | 'modification' | 'delay' | 'material' | 'attendance' | 'comment';
  content: string;
  photoUrl?: string;
  status: 'pending' | 'validated' | 'rejected' | 'clarification';
  aiAnalysis?: {
    modificationDetected: boolean;
    affectedRoom: string;
    budgetImpact: number;
    delayImpact: number;
    materialImpact: string;
    riskImpact: RiskLevel;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PlanningTask {
  id: string;
  chantierId: string;
  title: string;
  start: string;
  end: string;
  team: string;
  progress: number;
  dependencies?: string[];
}

export type ChantierInput = Omit<Chantier, 'id'> & { id?: string };
