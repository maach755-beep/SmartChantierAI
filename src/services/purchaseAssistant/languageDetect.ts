import type { PurchaseLanguage } from '@/types/purchaseAssistant';

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;

export function detectPurchaseLanguage(text: string): PurchaseLanguage {
  const hasAr = ARABIC_RE.test(text);
  const hasFr = /[a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(text);
  if (hasAr && hasFr) return 'mixed';
  if (hasAr) return 'ar';
  return 'fr';
}

/** Extract search hints from FR/AR/Darija mixed queries */
export function extractQueryHints(query: string): string[] {
  const lower = query.toLowerCase();
  const hints: string[] = [];
  const map: [RegExp, string][] = [
    [/marbre|رخام|effet marbre/i, 'marbre'],
    [/carrelage|بلاط|carreau/i, 'carrelage'],
    [/composite|مركب|lames?/i, 'composite'],
    [/plots?|بلاط.*plots/i, 'plots'],
    [/inox|316|304|ستانلس/i, 'inox'],
    [/parquet|باركيه/i, 'parquet'],
    [/colle|لاصق/i, 'colle'],
    [/joint|فواصل/i, 'joint'],
    [/peinture|طلاء/i, 'peinture'],
    [/paris|île-de-france|ile de france/i, 'ile_de_france'],
    [/paca|marseille|nice|côte d'azur|cote azur/i, 'paca'],
    [/lyon|rhône|rhone/i, 'auvergne_rhone_alpes'],
    [/bordeaux|nouvelle-aquitaine/i, 'nouvelle_aquitaine'],
    [/lille|hauts-de-france/i, 'hauts_de_france'],
    [/toulouse|occitanie/i, 'occitanie'],
    [/moins cher|رخيص|économique|budget/i, 'budget'],
    [/qualité|qualite|rapport qualité|احسن|meilleur/i, 'qualite'],
    [/60x120|60\s*[x×]\s*120/i, '60x120'],
    [/60x60/i, '60x60'],
    [/disponible|قلب|فين/i, 'dispo'],
  ];
  for (const [re, tag] of map) {
    if (re.test(query) || re.test(lower)) hints.push(tag);
  }
  return [...new Set(hints)];
}
