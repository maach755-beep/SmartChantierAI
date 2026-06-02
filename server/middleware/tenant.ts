import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface TenantRequest extends Request {
  tenantId: string;
}

export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['x-tenant-id'];
  (req as TenantRequest).tenantId =
    (typeof header === 'string' && header) || (req.query.tenantId as string) || env.defaultTenantId;
  next();
}
