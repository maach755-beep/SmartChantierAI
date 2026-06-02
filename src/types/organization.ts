/** Multi-company SaaS structures — demo only, no auth enforcement. */

import type { UserRole } from './auth';

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  country: string;
  plan: 'trial' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface OrgUser {
  id: string;
  companyId: string;
  email: string;
  displayName: string;
  role: UserRole;
  projectIds: string[];
  active: boolean;
}

export interface OrgProject {
  id: string;
  companyId: string;
  name: string;
  chantierIds: string[];
  managerUserId: string;
  budgetPlanned: number;
  status: 'active' | 'paused' | 'completed';
}

export interface OrganizationContext {
  company: Company;
  users: OrgUser[];
  projects: OrgProject[];
  currentUserId?: string;
}
