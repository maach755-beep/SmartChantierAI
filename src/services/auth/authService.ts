import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AuthUser, UserRole } from '@/types/auth';
import { getStorage, setStorage, removeStorage } from '@/utils/storage';

const LOCAL_USERS_KEY = 'scai_auth_users_v1';
const LOCAL_SESSION_KEY = 'scai_auth_session_v1';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
}

type StoredLocalUser = AuthUser & { passwordHash: string };

function hashPassword(password: string): string {
  return btoa(`${password}::scai`);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

const DEMO_ACCOUNTS: Omit<StoredLocalUser, 'id'>[] = [
  {
    email: 'admin@smartchantier.fr',
    passwordHash: hashPassword('Admin123!'),
    displayName: 'Administrateur',
    role: 'admin',
    companyId: 'demo-co',
  },
  {
    email: 'chef.projet@smartchantier.fr',
    passwordHash: hashPassword('Projet123!'),
    displayName: 'Chef de projet',
    role: 'project_manager',
    companyId: 'demo-co',
  },
  {
    email: 'chantier@smartchantier.fr',
    passwordHash: hashPassword('Chantier123!'),
    displayName: 'Chef de chantier',
    role: 'site_manager',
    companyId: 'demo-co',
  },
  {
    email: 'client@smartchantier.fr',
    passwordHash: hashPassword('Client123!'),
    displayName: 'Client Dupont',
    role: 'client',
    companyId: 'demo-co',
  },
];

function loadLocalUsers(): StoredLocalUser[] {
  const raw = getStorage<StoredLocalUser[] | null>(LOCAL_USERS_KEY, null);
  if (raw?.length) return raw;
  const seeded = DEMO_ACCOUNTS.map((u) => ({
    ...u,
    id: crypto.randomUUID(),
  }));
  setStorage(LOCAL_USERS_KEY, seeded);
  return seeded;
}

function saveLocalUsers(users: StoredLocalUser[]): void {
  setStorage(LOCAL_USERS_KEY, users);
}

function toAuthUser(u: StoredLocalUser): AuthUser {
  const { passwordHash: _p, ...rest } = u;
  void _p;
  return rest;
}

function setLocalSession(user: AuthUser | null): void {
  if (user) setStorage(LOCAL_SESSION_KEY, user);
  else removeStorage(LOCAL_SESSION_KEY);
}

export function getLocalSession(): AuthUser | null {
  return getStorage<AuthUser | null>(LOCAL_SESSION_KEY, null);
}

async function mapSupabaseUser(
  id: string,
  email: string,
  meta?: Record<string, unknown>
): Promise<AuthUser> {
  const role = (meta?.role as UserRole) ?? 'client';
  let profile: { display_name?: string; role?: UserRole } | null = null;
  if (supabase) {
    const { data } = await supabase.from('users').select('display_name, role').eq('id', id).maybeSingle();
    profile = data;
  }
  return {
    id,
    email,
    displayName: profile?.display_name ?? (meta?.display_name as string) ?? email.split('@')[0],
    role: profile?.role ?? role,
    companyId: meta?.company_id as string | undefined,
  };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) throw error;
    if (!data.user) throw new Error('Session invalide');
    const user = await mapSupabaseUser(data.user.id, data.user.email ?? normalized, data.user.user_metadata);
    return user;
  }

  const found = loadLocalUsers().find((u) => u.email === normalized);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    throw new Error('Email ou mot de passe incorrect');
  }
  const user = toAuthUser(found);
  setLocalSession(user);
  return user;
}

export async function signUp(input: RegisterInput): Promise<AuthUser> {
  const normalized = input.email.trim().toLowerCase();
  const role = input.role ?? 'client';

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password: input.password,
      options: {
        data: { display_name: input.displayName, role },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Inscription échouée');
    await supabase.from('users').upsert({
      id: data.user.id,
      email: normalized,
      display_name: input.displayName,
      role,
    });
    return mapSupabaseUser(data.user.id, normalized, { display_name: input.displayName, role });
  }

  const users = loadLocalUsers();
  if (users.some((u) => u.email === normalized)) {
    throw new Error('Un compte existe déjà avec cet email');
  }
  const created: StoredLocalUser = {
    id: crypto.randomUUID(),
    email: normalized,
    displayName: input.displayName,
    role,
    companyId: 'demo-co',
    passwordHash: hashPassword(input.password),
  };
  users.push(created);
  saveLocalUsers(users);
  const user = toAuthUser(created);
  setLocalSession(user);
  return user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return;
  }
  const exists = loadLocalUsers().some((u) => u.email === normalized);
  if (!exists) throw new Error('Aucun compte associé à cet email');
  // Demo mode: reset simulated (no email sent)
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  setLocalSession(null);
}

export async function resolveSession(): Promise<AuthUser | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;
    return mapSupabaseUser(
      data.session.user.id,
      data.session.user.email ?? '',
      data.session.user.user_metadata
    );
  }
  return getLocalSession();
}

export function authMode(): 'supabase' | 'local' {
  return isSupabaseConfigured ? 'supabase' : 'local';
}
