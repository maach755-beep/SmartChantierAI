/**
 * Ouvre une URL dans le navigateur système (évite le navigateur intégré Cursor/VS Code
 * lorsque l’ouverture provient d’un clic utilisateur explicite).
 */
export function openExternalUrl(url: string): void {
  const trimmed = url.trim();
  if (!trimmed) return;

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return;
  } catch {
    return;
  }

  const opened = window.open(trimmed, '_blank', 'noopener,noreferrer');
  if (opened) {
    opened.opener = null;
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = trimmed;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.referrerPolicy = 'no-referrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  }
}
