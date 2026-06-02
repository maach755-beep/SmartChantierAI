import type { ParsedProcurementQuery, ProcurementProjectType } from '@/types/procurementSearch';
import { inferCategoryFromQuery } from '@/services/purchaseAssistant/productSearchService';

const CITY_PATTERNS: [RegExp, string][] = [
  [/nice/i, 'Nice'],
  [/paris/i, 'Paris'],
  [/lyon/i, 'Lyon'],
  [/marseille/i, 'Marseille'],
  [/bordeaux/i, 'Bordeaux'],
  [/toulouse/i, 'Toulouse'],
  [/lille/i, 'Lille'],
  [/nantes/i, 'Nantes'],
  [/strasbourg/i, 'Strasbourg'],
  [/montpellier/i, 'Montpellier'],
  [/cannes|antibes|grasse/i, 'Cannes'],
];

const MATERIAL_LABELS: [RegExp, string][] = [
  [/carrelage|grès|cérame|cerame|faïence|faience/i, 'Carrelage'],
  [/parquet|stratifié|stratifie/i, 'Parquet / stratifié'],
  [/composite|lames/i, 'Lames composites'],
  [/peinture|enduit/i, 'Peinture / enduit'],
  [/colle|joint/i, 'Colles & joints'],
  [/plomberie|sanitaire/i, 'Plomberie'],
  [/électricité|electricite/i, 'Électricité'],
  [/menuiserie|porte/i, 'Menuiserie'],
];

function detectProjectType(q: string): ProcurementProjectType {
  if (/terrasse|extérieur|exterieur|balcon/i.test(q)) return 'terrasse';
  if (/piscine/i.test(q)) return 'piscine';
  if (/façade|facade|ite/i.test(q)) return 'facade';
  if (/rénovation|renovation|réhab/i.test(q)) return 'renovation';
  if (/neuf|construction neuve/i.test(q)) return 'neuf';
  if (/intérieur|interieur|sdb|appartement/i.test(q)) return 'interieur';
  return 'autre';
}

function detectMaterialType(q: string): string {
  for (const [re, label] of MATERIAL_LABELS) {
    if (re.test(q)) return label;
  }
  return 'Matériaux BTP';
}

function parseQuantity(q: string): number {
  const pourMatch = q.match(/pour\s+(\w+)\s+(\d+(?:[.,]\d+)?)\s*m[²2]/i);
  if (pourMatch) return parseFloat(pourMatch[2].replace(',', '.'));

  const surfaceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i);
  if (surfaceMatch) return parseFloat(surfaceMatch[1].replace(',', '.'));

  const qtyMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(m[²2]|ml|kg|sacs?|unités?)/i);
  if (qtyMatch) {
    const n = parseFloat(qtyMatch[1].replace(',', '.'));
    if (qtyMatch[2].toLowerCase().startsWith('m')) return n;
  }

  return 0;
}

export function parseProcurementQuery(raw: string): ParsedProcurementQuery {
  const q = raw.trim();
  let maxBudgetPerUnit = 0;
  let unit = 'm²';

  const budgetSlash = q.match(/(\d+(?:[.,]\d+)?)\s*€?\s*\/\s*(m²|m2|ml|u|kg|sac|unité|unite)/i);
  if (budgetSlash) {
    maxBudgetPerUnit = parseFloat(budgetSlash[1].replace(',', '.'));
    unit = budgetSlash[2].toLowerCase().replace('m2', 'm²');
  } else {
    const budgetWord = q.match(/budget\s*(\d+(?:[.,]\d+)?)\s*€?/i);
    if (budgetWord) maxBudgetPerUnit = parseFloat(budgetWord[1].replace(',', '.'));
  }

  let location = 'Paris';
  for (const [re, city] of CITY_PATTERNS) {
    if (re.test(q)) {
      location = city;
      break;
    }
  }

  const formatMatch = q.match(/(\d{2,3})\s*[x×]\s*(\d{2,3})/i);
  const formatHint = formatMatch ? `${formatMatch[1]}x${formatMatch[2]}` : '';
  const dimensions = formatHint || '';

  const projectType = detectProjectType(q);
  const usageHint =
    projectType === 'terrasse' || projectType === 'piscine' || /extérieur|exterieur/i.test(q)
      ? 'extérieur'
      : projectType === 'interieur' || /intérieur|interieur/i.test(q)
        ? 'intérieur'
        : '';

  const category = inferCategoryFromQuery(q) || '';
  const quantity = parseQuantity(q);

  return {
    rawQuery: q,
    productTerms: q,
    materialType: detectMaterialType(q),
    location,
    maxBudgetPerUnit,
    unit,
    category,
    formatHint,
    dimensions,
    quantity,
    projectType,
    usageHint,
    parsedByAi: false,
  };
}
