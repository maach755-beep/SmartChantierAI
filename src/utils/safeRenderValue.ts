import { isValidElement, type ReactNode } from 'react';

function formatLengthWidthObject(obj: Record<string, unknown>): string {
  const length = obj.length ?? obj.longueur ?? obj.l;
  const width = obj.width ?? obj.largeur ?? obj.w;
  const height = obj.height ?? obj.hauteur ?? obj.h ?? obj.thickness ?? obj.epaisseur;
  const parts = [length, width, height].filter((v) => v != null && v !== '');
  if (parts.length >= 2) {
    return parts.map((v) => String(v)).join(' × ');
  }
  return JSON.stringify(obj);
}

/** Coerce AI / OCR values to a display-safe string (never returns a plain object). */
export function normalizeToDisplayString(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => normalizeToDisplayString(item, ''))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (
      'length' in record ||
      'width' in record ||
      'longueur' in record ||
      'largeur' in record
    ) {
      return formatLengthWidthObject(record);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/** Use in JSX instead of rendering raw AI fields. */
export function safeRenderValue(value: unknown, fallback = '—'): ReactNode {
  if (isValidElement(value)) return value;
  if (value == null) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = typeof value === 'string' ? value.trim() : String(value);
    return text || fallback;
  }
  return normalizeToDisplayString(value, fallback);
}

/** Normalize optional string fields from LLM JSON before storing in app state. */
export function coerceAiStringField(value: unknown, fallback = ''): string {
  if (value == null || value === '') return fallback;
  return normalizeToDisplayString(value, fallback);
}
