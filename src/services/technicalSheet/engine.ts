import type { TechnicalSheetDocument, TechnicalSheetInput } from '@/types/technicalSheet';

function sheetNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `FT-${y}${m}${day}-${seq}`;
}

function parseSupplierHost(url: string): string {
  if (!url.trim()) return '—';
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./, '');
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return url.trim().slice(0, 48);
  }
}

function inferBrand(productName: string, reference: string): string {
  const refBrand = reference.split(/[-_\s]/)[0]?.trim();
  if (refBrand && refBrand.length >= 2) return refBrand.toUpperCase();
  const first = productName.trim().split(/\s+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'SmartChantier';
}

function pickMaterial(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('carrelage') || n.includes('grès')) return 'Grès cérame émaillé';
  if (n.includes('lame') || n.includes('composite')) return 'Composite co-extrudé';
  if (n.includes('isolation')) return 'Laine de roche';
  if (n.includes('peinture')) return 'Résine acrylique';
  if (n.includes('placo')) return 'Plâtre + carton';
  return 'Matériau BTP certifié CE';
}

/** Génère une fiche technique professionnelle (mode démo IA — France BTP). */
export async function generateTechnicalSheet(
  input: TechnicalSheetInput
): Promise<TechnicalSheetDocument> {
  await new Promise((r) => setTimeout(r, 600));

  const productName = input.productName.trim();
  const reference = input.reference.trim() || 'REF-À-COMPLÉTER';
  const supplierUrl = input.supplierUrl.trim();
  const supplier = parseSupplierHost(supplierUrl);
  const brand = inferBrand(productName, reference);
  const material = pickMaterial(productName);

  return {
    id: crypto.randomUUID(),
    sheetNumber: sheetNumber(),
    generatedAt: new Date().toISOString(),
    productName,
    reference,
    brand,
    supplier,
    supplierUrl,
    description: `${productName} — fiche technique BTP générée par SmartChantier AI. Produit adapté aux chantiers France (normes EN / DTU). Référence catalogue : ${reference}.`,
    specifications: [
      { label: 'Usage', value: 'Intérieur / extérieur selon DTU' },
      { label: 'Résistance', value: 'Classe usage intensif chantier' },
      { label: 'Température', value: '-20 °C à +60 °C' },
      { label: 'Absorption eau', value: '< 3 % (selon produit)' },
      { label: 'Antidérapant', value: 'R11 / R10 selon finition' },
    ],
    dimensions: '600 × 600 × 10 mm (format standard — confirmer sur fiche fournisseur)',
    weight: '28 kg/m² environ',
    material,
    color: 'Gris anthracite / teinte au choix',
    standards: 'EN 14411 · NF EN 1991 · Marquage CE · DTU applicable',
    fireRating: 'Euroclasse A1fl ou A2fl-s1 (selon produit)',
    warranty: '10 ans fabricant · 2 ans pose (conditions générales)',
  };
}
