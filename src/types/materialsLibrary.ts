export type MaterialLibraryCategory =
  | 'flooring'
  | 'paint'
  | 'insulation'
  | 'plasterboard'
  | 'tiles'
  | 'glue'
  | 'plumbing'
  | 'electrical'
  | 'facade'
  | 'roofing';

export interface LibraryMaterial {
  id: string;
  category: MaterialLibraryCategory;
  brand: string;
  model: string;
  description: string;
  technicalSheet: string;
  unitPrice: number;
  unit: string;
  supplier: string;
  photoUrl?: string;
  notes: string;
}
