import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Library, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { getMaterialsByCategory, searchMaterialsLibrary } from '@/services/materialsLibrary/store';
import type { MaterialLibraryCategory } from '@/types/materialsLibrary';
import { formatCurrency } from '@/utils/format';

const CATEGORIES: MaterialLibraryCategory[] = [
  'flooring',
  'paint',
  'insulation',
  'plasterboard',
  'tiles',
  'glue',
  'plumbing',
  'electrical',
  'facade',
  'roofing',
];

export function MaterialsLibraryPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<MaterialLibraryCategory | ''>('');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const base = category ? getMaterialsByCategory(category) : searchMaterialsLibrary(query);
    if (category && query.trim()) {
      const q = query.toLowerCase();
      return base.filter(
        (m) =>
          m.brand.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    return query.trim() && !category ? searchMaterialsLibrary(query) : base;
  }, [category, query]);

  return (
    <div>
      <PageHeader title={t('materialsLib.title')} subtitle={t('materialsLib.subtitle')} />
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('materialsLib.search')}
              className="w-full ps-9 pe-3 py-2 rounded-lg bg-btp-900 border border-btp-600/30 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MaterialLibraryCategory | '')}
            className="bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">{t('materialsLib.allCategories')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`materialsLib.cat_${c}`)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card
        title={t('materialsLib.catalog')}
        action={
          <Badge variant="gray">
            <Library className="w-3 h-3 inline me-1" />
            {rows.length}
          </Badge>
        }
      >
        <DataTable
          data={rows.map((m) => ({ ...m, id: m.id }))}
          emptyTitle={t('materialsLib.empty')}
          columns={[
            { key: 'category', header: t('materialsLib.category'), render: (r) => t(`materialsLib.cat_${r.category}`) },
            { key: 'brand', header: t('materialsLib.brand') },
            { key: 'model', header: t('materialsLib.model') },
            { key: 'unitPrice', header: t('materialsLib.price'), render: (r) => formatCurrency(r.unitPrice) },
            { key: 'supplier', header: t('materialsLib.supplier') },
            {
              key: 'description',
              header: t('materialsLib.description'),
              render: (r) => (r.description.length > 40 ? `${r.description.slice(0, 40)}…` : r.description),
            },
          ]}
        />
      </Card>
    </div>
  );
}
