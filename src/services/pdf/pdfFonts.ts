import type { jsPDF } from 'jspdf';

let fontDataBase64: string | null = null;
let preloadPromise: Promise<void> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const FONT_URLS = [
  '/fonts/DejaVuSans.ttf',
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf/DejaVuSans.ttf',
];

async function fetchFontBase64(urls: string[]): Promise<string> {
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return arrayBufferToBase64(await res.arrayBuffer());
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('Impossible de charger la police PDF (DejaVu Sans).');
}

/** Charge DejaVu Sans (é, è, à, ç, €, m²) pour jsPDF. */
export function preloadPdfFonts(): Promise<void> {
  if (fontDataBase64) return Promise.resolve();
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    fontDataBase64 = await fetchFontBase64(FONT_URLS);
  })();

  return preloadPromise;
}

function ensureUnicodeFont(doc: jsPDF): void {
  if (!fontDataBase64) {
    throw new Error('Police PDF non initialisée — appelez preloadPdfFonts() avant la génération.');
  }

  const fontId = 'DejaVuSans';
  const vfsName = 'DejaVuSans.ttf';

  if (!doc.getFontList()[fontId]) {
    doc.addFileToVFS(vfsName, fontDataBase64);
    doc.addFont(vfsName, fontId, 'normal');
    // Même fichier pour bold : jsPDF exige des tables Unicode pour splitTextToSize.
    doc.addFont(vfsName, fontId, 'bold');
  }
}

export function applyUnicodeFont(doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void {
  ensureUnicodeFont(doc);
  doc.setFont('DejaVuSans', style);
}

export const PDF_FONT_NAME = 'DejaVuSans';
