/**
 * Resilient supplier access — no direct scraping of blocked retailers (Leroy Merlin / Adeo).
 */


export const SUPPLIER_UNAVAILABLE_MESSAGE = 'Supplier temporarily unavailable';

export type SupplierBlockReason =
  | 'policy_no_scraping'
  | 'automated_requests_blocked'
  | 'http_forbidden'
  | 'fetch_failed';

export type SupplierUnavailableInfo = {
  supplier: string;
  reason: SupplierBlockReason;
  message: string;
  loggedAt: string;
};

const BLOCKED_BY_POLICY: readonly { names: string[]; domains: string[]; reason: SupplierBlockReason }[] = [
  {
    names: ['Leroy Merlin Pro', 'Leroy Merlin', 'Leroy Merlin Pro Services'],
    domains: ['leroymerlin.fr', 'leroy-merlin.fr', 'leroymerlin.com', 'leroymerlin.pro'],
    reason: 'automated_requests_blocked',
  },
  {
    names: ['Adeo', 'Adeo Group'],
    domains: ['adeo.com', 'adeo.fr', 'adeo-group.com'],
    reason: 'automated_requests_blocked',
  },
];

const blockedLog: SupplierUnavailableInfo[] = [];

const BLOCKED_PAGE_PATTERNS = [
  /access\s+denied/i,
  /request\s+blocked/i,
  /automated\s+requests?/i,
  /captcha/i,
  /cloudflare/i,
  /403\s+forbidden/i,
  /bot\s+detected/i,
  /adeo\s+group/i,
  /leroy\s*merlin.*indisponible/i,
];

function normalizeHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

export function isBlockedSupplierDomain(host: string): boolean {
  const h = normalizeHost(host);
  return BLOCKED_BY_POLICY.some((b) =>
    b.domains.some((d) => h === d || h.endsWith(`.${d}`))
  );
}

export function isBlockedSupplierName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  return BLOCKED_BY_POLICY.some((b) =>
    b.names.some((label) => n === label.toLowerCase() || n.includes(label.toLowerCase()))
  );
}

export function isBlockedSupplierUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return isBlockedSupplierDomain(host);
  } catch {
    return false;
  }
}

export function isBlockedPageContent(text: string): boolean {
  if (!text?.trim()) return false;
  return BLOCKED_PAGE_PATTERNS.some((re) => re.test(text));
}

export function isBlockedHttpStatus(status: number): boolean {
  return status === 403 || status === 429 || status === 451 || status === 503;
}

export function isBlockedFetchError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes('403') ||
    msg.includes('429') ||
    msg.includes('blocked') ||
    msg.includes('forbidden') ||
    msg.includes('captcha') ||
    msg.includes('econnrefused') && msg.includes('leroy')
  );
}

export function logBlockedSupplier(supplier: string, reason: SupplierBlockReason): void {
  const entry: SupplierUnavailableInfo = {
    supplier,
    reason,
    message: SUPPLIER_UNAVAILABLE_MESSAGE,
    loggedAt: new Date().toISOString(),
  };
  blockedLog.push(entry);
  console.warn(`[SmartChantier] Supplier blocked — ${supplier}: ${reason} (${SUPPLIER_UNAVAILABLE_MESSAGE})`);
}

export function getBlockedSupplierLog(): readonly SupplierUnavailableInfo[] {
  return blockedLog;
}

export function markSupplierUnavailable(
  supplier: string,
  reason: SupplierBlockReason
): SupplierUnavailableInfo {
  const existing = blockedLog.find(
    (e) => e.supplier === supplier && e.reason === reason
  );
  if (!existing) logBlockedSupplier(supplier, reason);
  return (
    existing ?? {
      supplier,
      reason,
      message: SUPPLIER_UNAVAILABLE_MESSAGE,
      loggedAt: new Date().toISOString(),
    }
  );
}

/** Pre-register policy-blocked suppliers for UI notices. */
export function collectPolicyBlockedSuppliers(): SupplierUnavailableInfo[] {
  const seen = new Set<string>();
  const out: SupplierUnavailableInfo[] = [];
  for (const block of BLOCKED_BY_POLICY) {
    for (const name of block.names.slice(0, 1)) {
      if (seen.has(name)) continue;
      seen.add(name);
      out.push(markSupplierUnavailable(name, block.reason));
    }
  }
  return out;
}

export function dedupeUnavailable(
  entries: Array<{ supplier: string; reason: string; message: string; loggedAt?: string }>
): SupplierUnavailableInfo[] {
  const map = new Map<string, SupplierUnavailableInfo>();
  for (const e of entries) {
    map.set(e.supplier, {
      supplier: e.supplier,
      reason: e.reason as SupplierBlockReason,
      message: e.message,
      loggedAt: e.loggedAt ?? new Date().toISOString(),
    });
  }
  return [...map.values()];
}
