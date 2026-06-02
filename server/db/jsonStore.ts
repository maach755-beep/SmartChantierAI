import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import type {
  DevisDocument,
  MaterialChangeRequest,
  MaterialRecord,
  PlanExtractionJob,
  PlanPhotoComparison,
  ProjectRecord,
  RoomRecord,
  Tenant,
} from '../../shared/plan-extraction/types.js';

export type DbSnapshot = {
  tenants: Tenant[];
  projects: ProjectRecord[];
  jobs: PlanExtractionJob[];
  rooms: RoomRecord[];
  materials: MaterialRecord[];
  devis: DevisDocument[];
  changes: MaterialChangeRequest[];
  comparisons: PlanPhotoComparison[];
  extractions: Record<string, import('../../shared/plan-extraction/types.js').PlanExtractionResult>;
};

const defaultDb: DbSnapshot = {
  tenants: [],
  projects: [],
  jobs: [],
  rooms: [],
  materials: [],
  devis: [],
  changes: [],
  comparisons: [],
  extractions: {},
};

let cache: DbSnapshot | null = null;

function dbPath(): string {
  return path.join(process.cwd(), env.dataDir, 'store.json');
}

export function loadDb(): DbSnapshot {
  if (cache) return cache;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    cache = structuredClone(defaultDb);
    saveDb();
    return cache;
  }
  cache = JSON.parse(fs.readFileSync(file, 'utf-8')) as DbSnapshot;
  return cache;
}

export function saveDb(): void {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(cache ?? defaultDb, null, 2), 'utf-8');
}

export function resetCache(): void {
  cache = null;
}
