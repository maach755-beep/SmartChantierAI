export type GlobalSearchCategory =
  | 'projects'
  | 'tasks'
  | 'teams'
  | 'materials'
  | 'suppliers'
  | 'documents'
  | 'reports'
  | 'aiAnalyses'
  | 'profitability';

export interface GlobalSearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface GlobalSearchGroup {
  category: GlobalSearchCategory;
  items: GlobalSearchResultItem[];
}

export interface GlobalSearchResponse {
  groups: GlobalSearchGroup[];
  totalCount: number;
}
