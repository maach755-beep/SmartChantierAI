import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileImage, FileText, Image, Search, Upload } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';
import { dataStore } from '@/services/dataStore';
import type { DocumentType } from '@/types';

const typeIcons: Record<DocumentType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  plan: FileImage,
  photo: Image,
  other: FileText,
};

export function DocumentsPage() {
  const { t } = useTranslation();
  const { documents, chantiers, refresh } = useDemoData();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [chantierFilter, setChantierFilter] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (chantierFilter && d.chantierId !== chantierFilter) return false;
      if (q && !d.name.toLowerCase().includes(q) && !d.tags.some((tag) => tag.includes(q))) return false;
      return true;
    });
  }, [documents, query, typeFilter, chantierFilter]);

  const upload = (type: DocumentType) => {
    const ch = chantiers[0];
    if (!ch) return;
    dataStore.addDocument({
      name: `${type === 'plan' ? 'Plan' : type === 'pdf' ? 'Document' : 'Photo'} — ${new Date().toLocaleDateString()}`,
      type,
      chantierId: ch.id,
      chantierName: ch.name,
      size: '1.2 Mo',
      uploadedBy: ch.manager,
      date: new Date().toISOString().slice(0, 10),
      tags: [type, 'upload'],
      url: type === 'photo' ? `https://picsum.photos/seed/up${Date.now()}/400/300` : undefined,
    });
    refresh();
  };

  return (
    <div>
      <PageHeader title={t('documents.title')} subtitle={t('documents.subtitle')} />

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={() => upload('pdf')}><Upload className="w-4 h-4" /> {t('documents.uploadPdf')}</Button>
        <Button variant="secondary" onClick={() => upload('plan')}><Upload className="w-4 h-4" /> {t('documents.uploadPlan')}</Button>
        <Button variant="secondary" onClick={() => upload('photo')}><Upload className="w-4 h-4" /> {t('documents.uploadPhoto')}</Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              placeholder={t('documents.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full ps-10 pe-3 py-2 rounded-lg bg-btp-800 border border-btp-600/40 text-white text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
            className="rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
          >
            <option value="all">{t('common.all')}</option>
            <option value="pdf">PDF</option>
            <option value="plan">{t('documents.plans')}</option>
            <option value="photo">{t('documents.photos')}</option>
          </select>
          <select
            value={chantierFilter}
            onChange={(e) => setChantierFilter(e.target.value)}
            className="rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
          >
            <option value="">{t('tasks.allProjects')}</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => {
          const Icon = typeIcons[doc.type];
          return (
            <Card key={doc.id}>
              {doc.url && doc.type === 'photo' && (
                <img src={doc.url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start gap-3">
                <Icon className="w-8 h-8 text-btp-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.chantierName}</p>
                  <p className="text-xs text-slate-600 mt-1">{doc.size} · {doc.date}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="blue">{doc.type}</Badge>
                    {doc.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] text-slate-500">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-slate-500 py-12">{t('common.noData')}</p>}
    </div>
  );
}
