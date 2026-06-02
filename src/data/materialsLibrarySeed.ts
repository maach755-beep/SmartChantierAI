import type { LibraryMaterial } from '@/types/materialsLibrary';

export const MATERIALS_LIBRARY_SEED: LibraryMaterial[] = [
  { id: 'ml-1', category: 'tiles', brand: 'Marazzi', model: 'Stonehenge 60x60', description: 'Grès cérame pleine masse extérieur', technicalSheet: 'Antidérapant R11 — absorption <0.5%', unitPrice: 42, unit: 'm²', supplier: 'BigMat Nice', notes: 'Piscine & terrasse' },
  { id: 'ml-2', category: 'tiles', brand: 'Porcelanosa', model: 'Urban 45x90', description: 'Faïence murale salle de bain', technicalSheet: 'PEI 4 — rectifié', unitPrice: 38, unit: 'm²', supplier: 'Leroy Merlin Pro', notes: 'SDB premium' },
  { id: 'ml-3', category: 'flooring', brand: 'Quick-Step', model: 'Impressive Ultra', description: 'Stratifié hydrofuge salon', technicalSheet: 'AC5 — 8mm', unitPrice: 28, unit: 'm²', supplier: 'Dispano', notes: 'Pose flottante' },
  { id: 'ml-4', category: 'flooring', brand: 'Tarkett', model: 'iD Inspiration', description: 'LVT adhésif bureaux', technicalSheet: 'Classe 34 — 2.5mm', unitPrice: 35, unit: 'm²', supplier: 'Point P', notes: 'Zones passage' },
  { id: 'ml-5', category: 'paint', brand: 'Dulux Valentine', model: 'Astral', description: 'Peinture acrylique mate intérieur', technicalSheet: 'Classe A+ — 10L', unitPrice: 89, unit: 'pot', supplier: 'Leroy Merlin Pro', notes: 'RAL au choix' },
  { id: 'ml-6', category: 'paint', brand: 'Zolpan', model: 'Pro Façade', description: 'Peinture siloxane façade', technicalSheet: '10 ans garantie', unitPrice: 120, unit: 'pot', supplier: 'Gedimat', notes: 'Exposition sud' },
  { id: 'ml-7', category: 'insulation', brand: 'Rockwool', model: 'Rocksol Evolution', description: 'Laine de roche combles', technicalSheet: 'λ=0.034 — R=6', unitPrice: 18, unit: 'm²', supplier: 'Point P', notes: 'Épaisseur 200mm' },
  { id: 'ml-8', category: 'insulation', brand: 'Isover', model: 'GR32', description: 'Rouleau murs intérieurs', technicalSheet: 'R=3.15 — 100mm', unitPrice: 12, unit: 'm²', supplier: 'Gedimat', notes: 'Cloison doublage' },
  { id: 'ml-9', category: 'plasterboard', brand: 'Placo', model: 'Plaquostil Hydro', description: 'BA13 hydrofuge zones humides', technicalSheet: 'NF — vert', unitPrice: 9.5, unit: 'm²', supplier: 'Dispano', notes: 'SDB / cuisine' },
  { id: 'ml-10', category: 'plasterboard', brand: 'Knauf', model: 'Diamant', description: 'Plaque haute dureté couloirs', technicalSheet: 'Impact résistant', unitPrice: 11, unit: 'm²', supplier: 'Dispano', notes: 'Circulation' },
  { id: 'ml-11', category: 'glue', brand: 'Mapei', model: 'Keraflex Maxi S1', description: 'Colle carrelage grand format', technicalSheet: 'C2TES1 — extérieur', unitPrice: 32, unit: 'sac 25kg', supplier: 'BigMat', notes: 'Piscine 60x60' },
  { id: 'ml-12', category: 'glue', brand: 'Weber', model: 'col flex', description: 'Colle carrelage standard', technicalSheet: 'C2E — intérieur', unitPrice: 18, unit: 'sac 25kg', supplier: 'Leroy Merlin Pro', notes: 'Second œuvre' },
  { id: 'ml-13', category: 'plumbing', brand: 'Geberit', model: 'Duofix', description: 'Bâti-support WC suspendu', technicalSheet: 'UP320 — 112cm', unitPrice: 420, unit: 'u', supplier: 'Chausson Matériaux', notes: 'SDB collective' },
  { id: 'ml-14', category: 'plumbing', brand: 'Nicoll', model: 'Optima', description: 'Évacuation PVC diam 100', technicalSheet: 'NF — lot 3m', unitPrice: 24, unit: 'ml', supplier: 'Chausson Matériaux', notes: 'Réseau EU' },
  { id: 'ml-15', category: 'electrical', brand: 'Legrand', model: 'Mosaic', description: 'Appareillage saillie', technicalSheet: 'Blanc — 2 postes', unitPrice: 8, unit: 'u', supplier: 'Leroy Merlin Pro', notes: 'Logements' },
  { id: 'ml-16', category: 'electrical', brand: 'Schneider', model: 'Resi9', description: 'Tableau divisionnaire 3 rangées', technicalSheet: '18 modules — IP30', unitPrice: 185, unit: 'u', supplier: 'Leroy Merlin Pro', notes: 'TGBT logement' },
  { id: 'ml-17', category: 'facade', brand: 'Weber', model: 'enduit monocouche', description: 'Enduit hydraulique gratté', technicalSheet: 'D2 — teinte pierre', unitPrice: 22, unit: 'm²', supplier: 'Point P', notes: 'ITE complément' },
  { id: 'ml-18', category: 'facade', brand: 'Sto', model: 'StoSil Classic', description: 'Silicone décoratif façade', technicalSheet: 'Biosourcé partiel', unitPrice: 28, unit: 'm²', supplier: 'Gedimat', notes: 'Finitions' },
  { id: 'ml-19', category: 'roofing', brand: 'Terreal', model: 'Méditerranea', description: 'Tuile terre cuite', technicalSheet: '45 tuiles/m²', unitPrice: 1.8, unit: 'u', supplier: 'Point P', notes: 'Pente >35%' },
  { id: 'ml-20', category: 'roofing', brand: 'Velux', model: 'CK02', description: 'Fenêtre de toit 55x78', technicalSheet: 'Bois — double vitrage', unitPrice: 520, unit: 'u', supplier: 'Gedimat', notes: 'Combles aménagés' },
];
