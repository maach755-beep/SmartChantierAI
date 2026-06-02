export interface TechnicalSpecification {
  label: string;
  value: string;
}

export interface TechnicalSheetInput {
  productName: string;
  reference: string;
  supplierUrl: string;
}

export interface TechnicalSheetDocument {
  id: string;
  sheetNumber: string;
  generatedAt: string;
  productName: string;
  reference: string;
  brand: string;
  supplier: string;
  supplierUrl: string;
  description: string;
  specifications: TechnicalSpecification[];
  dimensions: string;
  weight: string;
  material: string;
  color: string;
  standards: string;
  fireRating: string;
  warranty: string;
  /** Base64 data URL (JPEG/PNG) when available */
  imageDataUrl?: string;
}

export interface TechnicalSheetPdfLabels {
  title: string;
  sheetNumber: string;
  generatedAt: string;
  productName: string;
  reference: string;
  brand: string;
  supplier: string;
  description: string;
  specifications: string;
  dimensions: string;
  weight: string;
  material: string;
  color: string;
  standards: string;
  fireRating: string;
  warranty: string;
  productImage: string;
  supplierUrl: string;
  noImage: string;
  specLabel: string;
  specValue: string;
}
