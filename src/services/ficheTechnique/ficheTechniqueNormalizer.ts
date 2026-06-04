import type {
  FicheTechniqueSearchInput,
  TechnicalSheetConfidence,
  TechnicalSheetProduct,
} from '@/types/ficheTechnique';
import type { RealWebSearchHit } from '@/services/realSearch/types';
import { coerceAiStringField } from '@/utils/safeRenderValue';

export interface RawTechnicalSheetData {
  productName: string;
  reference?: string;
  brand?: string;
  manufacturer?: string;
  supplier?: string;
  category?: string;
  description?: string;
  useCase?: string;
  dimensions?: string;
  thickness?: string;
  weight?: string;
  material?: string;
  color?: string;
  finish?: string;
  indoorOutdoorUse?: string;
  resistance?: string;
  fireClassification?: string;
  thermalPerformance?: string;
  acousticPerformance?: string;
  slipResistance?: string;
  waterResistance?: string;
  uvResistance?: string;
  loadResistance?: string;
  certifications?: string;
  ceStandards?: string;
  normes?: string;
  warranty?: string;
  countryOfOrigin?: string;
  environmentalSheet?: string;
  safetySheet?: string;
  productUrl?: string;
  supplierUrl?: string;
  manufacturerUrl?: string;
  sourceUrls?: string[];
  confidenceScore?: number;
  resultOrigin?: 'real_web' | 'demo';
  priceLabel?: string;
  availabilityLabel?: string;
  isProvisional?: boolean;
  notes?: string;
}

function orDash(value?: unknown): string {
  const v = coerceAiStringField(value, '');
  return v && v !== '—' ? v : '—';
}

function inferConfidence(score: number, origin?: string, provisional?: boolean): TechnicalSheetConfidence {
  if (provisional) return 'estimee';
  if (origin !== 'real_web') return 'estimee';
  if (score >= 72) return 'confirme';
  if (score >= 45) return 'a_verifier';
  return 'estimee';
}

function extractFromText(blob: string): Partial<RawTechnicalSheetData> {
  const out: Partial<RawTechnicalSheetData> = {};
  const dim = blob.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})(?:\s*[x×]\s*(\d{1,3}))?\s*(?:mm|cm)?/i);
  if (dim) {
    out.dimensions = dim[3]
      ? `${dim[1]}×${dim[2]}×${dim[3]} mm`
      : `${dim[1]}×${dim[2]} cm`;
  }
  const thick = blob.match(/(?:épaisseur|epaisseur|thickness)[:\s]+(\d+(?:[.,]\d+)?)\s*mm/i);
  if (thick) out.thickness = `${thick[1].replace(',', '.')} mm`;
  const slip = blob.match(/\bR(?:10|11|12|9|13)\b/i);
  if (slip) out.slipResistance = slip[0].toUpperCase();
  const fire = blob.match(/(?:euroclasse|classement feu|fire)[:\s]*([A-Z0-9-]+(?:fl|s\d)?)/i);
  if (fire) out.fireClassification = fire[1];
  const norm = blob.match(/(?:EN|NF|DTU)\s*[\d.-]+(?:\s*·\s*(?:EN|NF|DTU)\s*[\d.-]+)*/gi);
  if (norm) {
    out.normes = norm.slice(0, 4).join(' · ');
    out.ceStandards = 'Marquage CE';
  }
  if (/hydrofuge|étanchéité|etancheite|imperméable/i.test(blob)) {
    out.waterResistance = 'Résistance à l\'eau / hydrofuge (selon fiche)';
  }
  if (/extérieur|exterieur|terrasse|façade|facade/i.test(blob)) {
    out.indoorOutdoorUse = 'Extérieur';
  } else if (/intérieur|interieur|sdb|pièce humide/i.test(blob)) {
    out.indoorOutdoorUse = 'Intérieur';
  }
  if (/inox\s*316|316L/i.test(blob)) out.material = 'Inox 316';
  else if (/grès|gres|cérame|cerame/i.test(blob)) out.material = 'Grès cérame';
  else if (/placo|plâtre|platre|ba13/i.test(blob)) out.material = 'Plâtre / plaque BA13';
  else if (/laine de roche|rockwool/i.test(blob)) out.material = 'Laine de roche';
  if (/garantie\s*(\d+\s*ans?)/i.test(blob)) {
    const m = blob.match(/garantie\s*(\d+\s*ans?)/i);
    if (m) out.warranty = m[1];
  }
  return out;
}

function inferBrand(name: string, reference: string, inputBrand?: string): string {
  if (inputBrand?.trim()) return inputBrand.trim();
  const brands = ['Tollens', 'Placo', 'Rockwool', 'Nice', 'Keraben', 'Porcelanosa', 'Weber', 'Sika'];
  for (const b of brands) {
    if (new RegExp(b, 'i').test(name)) return b;
  }
  const refBrand = reference.split(/[-_\s]/)[0]?.trim();
  if (refBrand && refBrand.length >= 2) return refBrand.toUpperCase();
  return '—';
}

function inferCategory(name: string, inputCategory?: string): string {
  if (inputCategory?.trim()) return inputCategory.trim();
  const n = name.toLowerCase();
  if (/carrelage|grès|gres|cérame/i.test(n)) return 'Carrelage';
  if (/placo|ba13|plâtre/i.test(n)) return 'Plaques & cloisons';
  if (/garde-corps|garde corps|inox/i.test(n)) return 'Métallerie / garde-corps';
  if (/peinture|tollens|facade|façade/i.test(n)) return 'Peinture & enduits';
  if (/isolant|rockwool|laine/i.test(n)) return 'Isolation';
  if (/colle|mortier|c2s1/i.test(n)) return 'Colles & mortiers';
  if (/receveur|douche/i.test(n)) return 'Sanitaire';
  return 'Matériaux BTP';
}

export function extractTechnicalSheetFromResult(
  hit: RealWebSearchHit,
  input: FicheTechniqueSearchInput
): RawTechnicalSheetData {
  const blob = `${hit.productTitle} ${hit.summary}`;
  const extracted = extractFromText(blob);

  return {
    productName: hit.productTitle,
    reference: hit.reference || input.reference || undefined,
    brand: inferBrand(hit.productTitle, input.reference, input.brand),
    manufacturer: input.brand?.trim() || inferBrand(hit.productTitle, input.reference),
    supplier: hit.supplierName,
    category: inferCategory(hit.productTitle, input.category),
    description: hit.summary.slice(0, 500),
    useCase: input.useCase || '—',
    dimensions: extracted.dimensions,
    thickness: extracted.thickness,
    material: extracted.material,
    slipResistance: extracted.slipResistance,
    fireClassification: extracted.fireClassification,
    waterResistance: extracted.waterResistance,
    indoorOutdoorUse: extracted.indoorOutdoorUse,
    normes: extracted.normes,
    ceStandards: extracted.ceStandards,
    warranty: extracted.warranty,
    productUrl: hit.url,
    supplierUrl: input.supplierUrl.trim() || hit.url,
    manufacturerUrl: input.manufacturerUrl.trim(),
    sourceUrls: [hit.url],
    confidenceScore: hit.confidence,
    resultOrigin: hit.resultOrigin,
    priceLabel: hit.priceLabel,
    availabilityLabel: hit.availabilityLabel,
    notes: `Source : ${hit.sourceLabel} · Score page produit ${hit.productPageScore}`,
  };
}

export function buildProvisionalRawData(input: FicheTechniqueSearchInput): RawTechnicalSheetData {
  const blob = [
    input.productName,
    input.reference,
    input.brand,
    input.category,
    input.useCase,
  ].join(' ');
  const extracted = extractFromText(blob);

  return {
    productName: input.productName.trim(),
    reference: input.reference.trim() || 'REF-À-VÉRIFIER',
    brand: inferBrand(input.productName, input.reference, input.brand),
    manufacturer: input.brand.trim() || '—',
    supplier: input.supplierUrl.trim() ? parseHost(input.supplierUrl) : '—',
    category: inferCategory(input.productName, input.category),
    description: `${input.productName} — fiche technique provisoire générée par SmartChantier AI. Données à confirmer auprès du fabricant/fournisseur.`,
    useCase: input.useCase.trim() || '—',
    dimensions: extracted.dimensions,
    thickness: extracted.thickness,
    material: extracted.material,
    slipResistance: extracted.slipResistance,
    fireClassification: extracted.fireClassification,
    waterResistance: extracted.waterResistance,
    indoorOutdoorUse: extracted.indoorOutdoorUse,
    normes: extracted.normes,
    ceStandards: extracted.ceStandards || 'À vérifier',
    warranty: extracted.warranty || 'À confirmer',
    productUrl: input.supplierUrl.trim() || input.manufacturerUrl.trim(),
    supplierUrl: input.supplierUrl.trim(),
    manufacturerUrl: input.manufacturerUrl.trim(),
    sourceUrls: [input.supplierUrl, input.manufacturerUrl].filter(Boolean),
    confidenceScore: 15,
    resultOrigin: 'demo',
    isProvisional: true,
    notes: 'Fiche technique provisoire — données à vérifier. Aucune fiche produit web exacte trouvée.',
  };
}

function parseHost(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 48);
  }
}

export function normalizeTechnicalSheet(raw: RawTechnicalSheetData): TechnicalSheetProduct {
  const confidence = inferConfidence(
    raw.confidenceScore ?? 0,
    raw.resultOrigin,
    raw.isProvisional
  );

  const sourceUrls = [...new Set((raw.sourceUrls ?? []).filter(Boolean))];

  return {
    id: crypto.randomUUID(),
    productName: orDash(raw.productName),
    reference: orDash(raw.reference),
    brand: orDash(raw.brand),
    manufacturer: orDash(raw.manufacturer),
    supplier: orDash(raw.supplier),
    category: orDash(raw.category),
    description: orDash(raw.description),
    useCase: orDash(raw.useCase),
    dimensions: orDash(raw.dimensions),
    thickness: orDash(raw.thickness),
    weight: orDash(raw.weight),
    material: orDash(raw.material),
    color: orDash(raw.color),
    finish: orDash(raw.finish),
    indoorOutdoorUse: orDash(raw.indoorOutdoorUse),
    resistance: orDash(raw.resistance),
    fireClassification: orDash(raw.fireClassification),
    thermalPerformance: orDash(raw.thermalPerformance),
    acousticPerformance: orDash(raw.acousticPerformance),
    slipResistance: orDash(raw.slipResistance),
    waterResistance: orDash(raw.waterResistance),
    uvResistance: orDash(raw.uvResistance),
    loadResistance: orDash(raw.loadResistance),
    certifications: orDash(raw.certifications),
    ceStandards: orDash(raw.ceStandards),
    normes: orDash(raw.normes),
    warranty: orDash(raw.warranty),
    countryOfOrigin: orDash(raw.countryOfOrigin),
    environmentalSheet: orDash(raw.environmentalSheet),
    safetySheet: orDash(raw.safetySheet),
    productUrl: orDash(raw.productUrl),
    supplierUrl: orDash(raw.supplierUrl),
    manufacturerUrl: orDash(raw.manufacturerUrl),
    sourceUrls,
    confidence,
    isProvisional: Boolean(raw.isProvisional),
    priceLabel: raw.priceLabel,
    availabilityLabel: raw.availabilityLabel,
    generatedAt: new Date().toISOString(),
    notes: raw.notes?.trim() || (raw.isProvisional ? 'Fiche provisoire — données à vérifier.' : ''),
  };
}
