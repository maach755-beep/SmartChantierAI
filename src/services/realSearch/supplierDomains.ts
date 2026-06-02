/** Fournisseurs BTP France ciblés par la recherche Tavily. */

export interface BtpSupplierTarget {
  name: string;
  domains: string[];
  aliases: string[];
}

export const BTP_WEB_SUPPLIERS: BtpSupplierTarget[] = [
  { name: 'Point P', domains: ['pointp.fr'], aliases: ['point p', 'pointp'] },
  { name: 'BigMat', domains: ['bigmat.fr'], aliases: ['bigmat', 'big mat'] },
  { name: 'Gedimat', domains: ['gedimat.fr'], aliases: ['gedimat'] },
  {
    name: 'Chausson Matériaux',
    domains: ['chausson.fr', 'chausson-materiaux.fr'],
    aliases: ['chausson', 'chausson matériaux', 'chausson materiaux'],
  },
  { name: 'Leroy Merlin Pro', domains: ['leroymerlin.fr'], aliases: ['leroy merlin', 'leroymerlin'] },
  {
    name: 'La Plateforme du Bâtiment',
    domains: ['lpb.fr', 'laplateforme.com'],
    aliases: ['plateforme du bâtiment', 'lpb', 'la plateforme'],
  },
  { name: 'Samse', domains: ['samse.fr'], aliases: ['samse'] },
  { name: 'Dispano', domains: ['dispano.fr'], aliases: ['dispano'] },
  { name: 'CEDEO', domains: ['cedeo.fr'], aliases: ['cedeo'] },
  { name: 'Frans Bonhomme', domains: ['fransbonhomme.fr'], aliases: ['frans bonhomme', 'fransbonhomme'] },
];

export const BTP_SUPPLIER_DOMAIN_LIST = BTP_WEB_SUPPLIERS.flatMap((s) => s.domains);

export const BTP_SUPPLIER_NAMES_FOR_QUERY = BTP_WEB_SUPPLIERS.map((s) => s.name);

export function detectSupplierFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    for (const s of BTP_WEB_SUPPLIERS) {
      if (s.domains.some((d) => host === d || host.endsWith(`.${d}`))) return s.name;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function detectSupplierFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const s of BTP_WEB_SUPPLIERS) {
    if (s.aliases.some((a) => lower.includes(a)) || lower.includes(s.name.toLowerCase())) {
      return s.name;
    }
  }
  return null;
}
