/**
 * Détecte les fiches produit vs pages d'accueil / catégories (fournisseurs BTP France).
 */

/** Identifiant produit dans l'URL (référence, SKU, .html avec ID). */
const PRODUCT_ID_IN_PATH = [
  /\d{6,}/,
  /-\d{6,}\.html$/i,
  /ref[_-]?\d+/i,
  /\/p\/\d+/i,
  /\/art\d+/i,
  /\.html$/i,
];

/** Chemins typiques d'une fiche produit (avec identifiant). */
const STRONG_PRODUCT_PATH = [
  /\/produits\/[^/]*\d{5,}[^/]*\.html/i,
  /\/produit[s]?\/[^/]*\d{4,}/i,
  /\/product[s]?\/[^/]+/i,
  /\/p\/[^/]+/i,
  /\/fiche[s]?\/[^/]+/i,
  /\/ref(?:erence)?[/-][^/]+/i,
  /\/catalogue\/[^/]+\/[^/]+/i,
];

/** Pages génériques à exclure. */
const NON_PRODUCT_PATH_PATTERNS = [
  /^\/$/i,
  /\/accueil\/?$/i,
  /\/home\/?$/i,
  /\/index\.html?$/i,
  /\/catalogue\/?$/i,
  /\/catalogues?\/?$/i,
  /\/categor(?:ie|y)(?:s)?\/?$/i,
  /\/c\//i,
  /\/rayon[s]?\/?$/i,
  /\/univers\/?$/i,
  /\/gamme[s]?\/?$/i,
  /\/marque[s]?\/?$/i,
  /\/magasin[s]?\/?$/i,
  /\/agence[s]?\/?$/i,
  /\/store[s]?\/?$/i,
  /\/contact\/?$/i,
  /\/login\/?$/i,
  /\/compte\/?$/i,
  /\/panier\/?$/i,
  /\/cart\/?$/i,
  /\/recherche\/?$/i,
  /\/search\/?$/i,
  /\/blog\/?/i,
  /\/professionnel[s]?\/?$/i,
  /\/pro\/?$/i,
  /\/materiaux\/?$/i,
  /\/carrelage\/?$/i,
  /\/carrelage-[^/]+\/?$/i,
  /\/revetement[^/]*\/?$/i,
];

const NON_PRODUCT_TITLE_PATTERNS = [
  /^accueil\b/i,
  /^catalogue\b/i,
  /^carrelage extérieur\s*\|/i,
  /^carrelage extérieur\s*\(/i,
  /^nos (?:produits|rayons|catégories)/i,
  /^tous nos\b/i,
  /^magasin\b/i,
  /^agence\b/i,
  /^contact\b/i,
  /\|\s*leroy merlin\s*$/i,
  /\|\s*point\.?p\s*$/i,
  /(?:site officiel|page d'accueil)/i,
];

const PRODUCT_TITLE_SIGNALS = [
  /\d{2,3}\s*[x×]\s*\d{2,3}/,
  /\d+(?:[.,]\d+)?\s*€/,
  /\b(?:ref|réf|sku)\s*[:.]?\s*[\w-]+/i,
  /\bl\.\d+\s*x\s*l\.\d+/i,
  /\b(?:m²|m2|ep\.|épaisseur)/i,
];

export interface ProductPageClassification {
  isProductPage: boolean;
  productPageScore: number;
  rejectReason?: string;
}

function pathnameOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.toLowerCase();
  } catch {
    return '';
  }
}

function hasProductIdInPath(path: string): boolean {
  return PRODUCT_ID_IN_PATH.some((re) => re.test(path));
}

/** Arborescence /produits/…/…/sans ID = rayon catégorie (Leroy Merlin, etc.). */
function isMultiLevelCategoryPath(path: string): boolean {
  const match = path.match(/\/produits\/(.+)/i);
  if (!match) return false;
  const tail = match[1];
  const segments = tail.split('/').filter(Boolean);
  if (segments.length < 2) return false;
  const last = segments[segments.length - 1] ?? '';
  return !hasProductIdInPath(path) && !last.endsWith('.html');
}

export function classifyProductUrl(url: string, title: string, content: string): ProductPageClassification {
  const path = pathnameOf(url);
  const blob = `${title} ${content}`.toLowerCase();

  for (const re of NON_PRODUCT_PATH_PATTERNS) {
    if (re.test(path)) {
      return { isProductPage: false, productPageScore: 0, rejectReason: 'category_or_home_path' };
    }
  }

  if (isMultiLevelCategoryPath(path)) {
    return { isProductPage: false, productPageScore: 0, rejectReason: 'category_tree' };
  }

  for (const re of NON_PRODUCT_TITLE_PATTERNS) {
    if (re.test(title.trim())) {
      return { isProductPage: false, productPageScore: 0, rejectReason: 'generic_title' };
    }
  }

  const hasId = hasProductIdInPath(path);
  const strongPath = STRONG_PRODUCT_PATH.some((re) => re.test(path));

  let score = 0;
  if (hasId) score += 50;
  if (strongPath) score += 25;
  if (PRODUCT_TITLE_SIGNALS.some((re) => re.test(title) || re.test(blob))) score += 20;
  if (/\d+(?:[.,]\d+)?\s*€/.test(blob)) score += 20;
  if (/(?:en stock|disponible|ajouter au panier)/i.test(blob)) score += 10;

  const isProductPage = hasId || (strongPath && score >= 55);
  return {
    isProductPage,
    productPageScore: Math.min(100, score),
    rejectReason: isProductPage ? undefined : 'not_product_page',
  };
}

export function cleanProductTitle(title: string, supplier: string): string {
  let t = title.trim();
  const suppliers = [
    supplier,
    'Point P',
    'BigMat',
    'Gedimat',
    'Chausson',
    'Leroy Merlin',
    'Samse',
    'Dispano',
    'CEDEO',
    'Frans Bonhomme',
    'La Plateforme du Bâtiment',
  ];
  for (const s of suppliers) {
    t = t.replace(new RegExp(`^${s}\\s*[-–|:]\\s*`, 'i'), '');
    t = t.replace(new RegExp(`\\s*[-–|]\\s*${s}\\s*$`, 'i'), '');
  }
  t = t.replace(/\s*\|\s*(?:Leroy Merlin|Point\.?P|BigMat).*$/i, '').trim();
  return t.length > 5 ? t : title.trim();
}
