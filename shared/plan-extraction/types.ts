/** Canonical domain types — shared by API, DB, and frontend (SaaS-ready). */

export type Lang = 'fr' | 'ar' | 'en';
export type TenantRole = 'owner' | 'admin' | 'project_manager' | 'architect' | 'developer' | 'field_worker' | 'viewer';
export type PlanFileKind = 'pdf' | 'image' | 'screenshot' | 'technical_drawing' | 'colored_plan' | 'photo';
export type ExtractionStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'needs_vision_api';
export type CoveringKind = 'floor' | 'wall' | 'ceiling';
export type Currency = 'MAD' | 'EUR';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'trial' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  email: string;
}

export interface ProjectRecord {
  id: string;
  tenantId: string;
  name: string;
  client: string;
  address: string;
  progressPercent: number;
  budgetPercent: number;
  delayPercent: number;
  currency: Currency;
  vatRate: number;
  marginRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRecord {
  id: string;
  tenantId: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
}

export interface MaterialRecord {
  id: string;
  tenantId: string;
  projectId: string;
  reference: string;
  brand: string;
  model: string;
  color: string;
  name: string;
  unit: string;
  unitPrice: number;
  stock: number;
  supplierId?: string;
  legendCode?: string;
  createdAt: string;
}

export interface RoomRecord {
  id: string;
  tenantId: string;
  projectId: string;
  extractionId: string;
  name: string;
  surfaceSqm: number;
  floorReference?: string;
  floorMaterialId?: string;
  wallMaterialId?: string;
  ceilingMaterialId?: string;
  technicalNotes: string[];
}

export interface FloorCoveringRecord {
  id: string;
  tenantId: string;
  projectId: string;
  roomId: string;
  materialId: string;
  surfaceSqm: number;
  quantity: number;
}

export interface WallCoveringRecord {
  id: string;
  tenantId: string;
  projectId: string;
  roomId: string;
  materialId: string;
  surfaceSqm: number;
  quantity: number;
}

export interface CeilingRecord {
  id: string;
  tenantId: string;
  projectId: string;
  roomId: string;
  materialId: string;
  surfaceSqm: number;
  quantity: number;
}

export interface ColoredZone {
  id: string;
  colorHex: string;
  colorLabel: string;
  zoneName: string;
  materialName: string;
  surfaceSqm: number;
  legendCode?: string;
  roomId?: string;
}

export interface OcrLegend {
  code: string;
  label: string;
  materialHint?: string;
}

export interface OcrSymbol {
  code: string;
  meaning: string;
}

export interface PlanExtractionJob {
  id: string;
  tenantId: string;
  projectId: string;
  fileName: string;
  fileKind: PlanFileKind;
  mimeType: string;
  storagePath: string;
  status: ExtractionStatus;
  errorMessage?: string;
  provider: string;
  createdAt: string;
  completedAt?: string;
}

export interface PlanExtractionResult {
  jobId: string;
  tenantId: string;
  projectId: string;
  status: ExtractionStatus;
  rooms: RoomRecord[];
  materials: MaterialRecord[];
  floorCoverings: FloorCoveringRecord[];
  wallCoverings: WallCoveringRecord[];
  ceilings: CeilingRecord[];
  coloredZones: ColoredZone[];
  legends: OcrLegend[];
  symbols: OcrSymbol[];
  technicalNotes: string[];
  tables: GeneratedTable[];
  rawOcrText?: string;
}

export interface GeneratedTable {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string | number>[];
}

export interface DevisLine {
  id: string;
  zone: string;
  surfaceSqm: number;
  material: string;
  brand: string;
  model: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalHt: number;
}

export interface DevisDocument {
  id: string;
  tenantId: string;
  projectId: string;
  extractionId: string;
  lines: DevisLine[];
  subtotalHt: number;
  marginAmount: number;
  vatAmount: number;
  totalTtc: number;
  currency: Currency;
  createdAt: string;
}

export interface MaterialChangeRequest {
  id: string;
  tenantId: string;
  projectId: string;
  roomId: string;
  oldMaterialId: string;
  newMaterialId: string;
  quantityDelta: number;
  priceDelta: number;
  budgetImpact: number;
  createdAt: string;
}

export interface PlanPhotoComparison {
  id: string;
  tenantId: string;
  projectId: string;
  planJobId: string;
  photoId: string;
  completionPercent: number;
  differencePercent: number;
  riskScore: number;
  missingWork: string[];
  wrongMaterials: string[];
  delays: string[];
  finishedZones: string[];
  alerts: string[];
  createdAt: string;
}

export interface PlanExtractionKpis {
  totalSurfaceSqm: number;
  materialsOrdered: number;
  materialsInstalled: number;
  progressPercent: number;
  budgetPercent: number;
  delayPercent: number;
  riskCount: number;
  alertCount: number;
}

export interface AssistantPlanContext {
  projectId: string;
  extractionId?: string;
  rooms: RoomRecord[];
  materials: MaterialRecord[];
  devis?: DevisDocument;
}
