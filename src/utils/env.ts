/** Read Vite env in browser and Node (tsx scripts). */

export function readAppEnv(key: string, fallback = ''): string {
  const vite = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : undefined;
  const fromVite = vite?.[key as keyof typeof vite];
  if (typeof fromVite === 'string' && fromVite.trim()) return fromVite.trim();

  const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env?.[key];
  return typeof nodeEnv === 'string' && nodeEnv.trim() ? nodeEnv.trim() : fallback;
}

export function isViteDevMode(): boolean {
  return (
    typeof import.meta !== 'undefined' &&
    Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)
  );
}
