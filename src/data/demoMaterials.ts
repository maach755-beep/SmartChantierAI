import type { MaterialItem, SitePhoto, TeamMember } from '@/types';
import { demoChantiers, demoSuppliers, demoWorkers } from './demoData';

const materialCatalog = [
  { name: 'Ciment CPJ45', category: 'Gros œuvre', unit: 'sac' },
  { name: 'Sable 0/4', category: 'Gros œuvre', unit: 'm³' },
  { name: 'Carrelage 60x60 grès', category: 'Revêtements', unit: 'm²' },
  { name: 'Colle carrelage C2', category: 'Revêtements', unit: 'sac' },
  { name: 'Peinture mate RAL 9010', category: 'Finitions', unit: 'L' },
  { name: 'Parquet chêne 14mm', category: 'Revêtements', unit: 'm²' },
  { name: 'Tubes PVC évacuation', category: 'Plomberie', unit: 'ml' },
  { name: 'Câble électrique 3G2.5', category: 'Électricité', unit: 'ml' },
  { name: 'Plaques BA13', category: 'Cloisons', unit: 'unité' },
  { name: 'Laine de roche 60mm', category: 'Isolation', unit: 'm²' },
  { name: 'Porte intérieure standard', category: 'Menuiserie', unit: 'unité' },
  { name: 'Robinetterie lavabo', category: 'Plomberie', unit: 'unité' },
];

export const demoMaterials: MaterialItem[] = Array.from({ length: 36 }, (_, i) => {
  const ch = demoChantiers[i % demoChantiers.length];
  const mat = materialCatalog[i % materialCatalog.length];
  const sup = demoSuppliers[i % demoSuppliers.length];
  const required = 50 + (i % 20) * 5;
  const onSite = required - (i % 7) * 8;
  const ordered = i % 4 === 0 ? 20 : 0;
  let status: MaterialItem['status'] = 'ok';
  if (onSite < required * 0.3) status = 'critical';
  else if (onSite < required * 0.6) status = 'low';
  else if (ordered > 0) status = 'ordered';

  return {
    id: `mat_${i + 1}`,
    name: mat.name,
    category: mat.category,
    unit: mat.unit,
    quantityRequired: required,
    quantityOnSite: Math.max(0, onSite),
    quantityOrdered: ordered,
    chantierId: ch.id,
    chantierName: ch.name,
    supplierName: sup.name,
    status,
  };
});

const photoTags = ['avancement', 'qualité', 'SDB', 'cuisine', 'façade', 'terrasse', 'électricité', 'plomberie'];

export const demoSitePhotos: SitePhoto[] = Array.from({ length: 24 }, (_, i) => {
  const ch = demoChantiers[i % demoChantiers.length];
  const rooms = ['Salon', 'Cuisine', 'SDB', 'Chambre 1', 'Terrasse', 'Hall'];
  const phase: SitePhoto['phase'] = i % 5 === 2 ? 'before' : i % 5 === 3 ? 'after' : 'progress';
  return {
    id: `photo_${i + 1}`,
    chantierId: ch.id,
    chantierName: ch.name,
    room: rooms[i % rooms.length],
    url: `https://picsum.photos/seed/scphoto${i}/640/480`,
    uploadedBy: ch.manager,
    date: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    tags: [photoTags[i % photoTags.length], photoTags[(i + 2) % photoTags.length]],
    phase,
    caption: `${rooms[i % rooms.length]} — ${ch.name}`,
    fileSize: `${750 + i * 30} Ko`,
    albumId: `album_${ch.id}_${Math.floor(i / 4) % 3}`,
  };
});

const teams = ['Équipe Maçonnerie', 'Équipe Électricité', 'Équipe Plomberie', 'Équipe Finitions'];

export const demoTeamMembers: TeamMember[] = demoWorkers.map((w, i) => {
  const ch = demoChantiers.find((c) => c.id === w.chantierId)!;
  const isManager = i % 8 === 0;
  const isEngineer = i % 11 === 0;
  const roleType = isEngineer ? 'engineer' : isManager ? 'site_manager' : 'worker';
  return {
    id: w.id,
    name: w.name,
    trade: w.trade,
    role: isEngineer ? 'Ingénieur BTP' : isManager ? 'Chef de chantier' : i % 5 === 0 ? 'Chef d\'équipe' : 'Ouvrier qualifié',
    roleType,
    team: teams[i % teams.length],
    chantierId: ch.id,
    chantierName: ch.name,
    phone: w.phone ?? '+212 600 000000',
    email: `${w.name.toLowerCase().replace(/\s+/g, '.')}@smartchantier.ma`,
    active: i % 17 !== 0,
    hoursThisWeek: 32 + (i % 8),
  };
});
