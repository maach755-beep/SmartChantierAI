import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { Card } from '@/components/ui/Card';
import { QuickNav } from '@/components/layout/QuickNav';
import { useDemoData } from '@/hooks/useDemoData';
import { exportToPdf, exportToExcel, exportToCsv } from '@/services/exportService';
import { formatCurrency } from '@/utils/format';

export function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { chantiers, risks, modifications, attendance, materials, tasks } = useDemoData();
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [chantierId, setChantierId] = useState('');

  const types = [
    { id: 'daily' as const, label: t('reports.daily') },
    { id: 'weekly' as const, label: t('reports.weekly') },
    { id: 'monthly' as const, label: t('reports.monthly') },
  ];

  const selectedChantiers = chantierId ? chantiers.filter((c) => c.id === chantierId) : chantiers;

  const generate = async () => {
    const lang = i18n.language === 'ar' ? 'AR' : 'FR';
    await exportToPdf(`${t('reports.title')} ${type} [${lang}]`, [
      { heading: t('reports.advancement'), lines: selectedChantiers.map((c) => `${c.name}: ${c.progress}%`) },
      { heading: t('risks.title'), lines: risks.slice(0, 8).map((r) => `${r.chantierName}: ${r.description}`) },
      { heading: t('reports.delays'), lines: selectedChantiers.filter((c) => c.delayDays > 0).map((c) => `${c.name}: ${c.delayDays}j`) },
      { heading: t('modifications.title'), lines: modifications.slice(0, 6).map((m) => m.title) },
      { heading: t('reports.attendance'), lines: [`Présents: ${attendance.filter((a) => a.present).length}`] },
      {
        heading: t('materials.title'),
        lines: materials.filter((m) => m.status === 'critical').map((m) => `${m.chantierName}: ${m.name}`),
      },
      { heading: t('tasks.title'), lines: [`Bloquées: ${tasks.filter((tk) => tk.status === 'blocked').length}`] },
    ]);
  };

  const reportHeaders = [t('common.chantier'), t('common.progress'), t('common.budget'), t('projects.delay')];
  const reportRows = selectedChantiers.map((c) => [c.name, c.progress, c.budgetConsumed, c.delayDays]);

  const exportExcel = () => {
    exportToExcel(`rapport_${type}`, reportHeaders, reportRows);
  };

  const exportCsv = () => {
    exportToCsv(`rapport_${type}`, reportHeaders, reportRows);
  };

  return (
    <div>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <QuickNav
        links={[
          { to: '/projets', labelKey: 'nav.projects' },
          { to: '/pilotage', labelKey: 'nav.commandCenter' },
          { to: '/analyse-ia', labelKey: 'nav.aiAnalysis' },
          { to: '/', labelKey: 'nav.dashboard' },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {types.map((tp) => (
          <button
            key={tp.id}
            type="button"
            onClick={() => setType(tp.id)}
            className={`p-4 rounded-xl border text-start transition-colors ${
              type === tp.id ? 'border-btp-500 bg-btp-800/50' : 'border-btp-700/40 bg-btp-900/30'
            }`}
          >
            <FileText className="w-5 h-5 text-btp-400 mb-2" />
            <p className="font-medium text-white">{tp.label}</p>
          </button>
        ))}
      </div>

      <select
        value={chantierId}
        onChange={(e) => setChantierId(e.target.value)}
        className="mb-4 w-full max-w-md bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">{t('reports.allProjects')}</option>
        {chantiers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title={t('reports.preview')}>
          <ul className="text-sm text-slate-400 space-y-2">
            {selectedChantiers.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={`/suivi/${c.id}`} className="text-btp-300 hover:underline">
                  {c.name}
                </Link>
                {' — '}
                {c.progress}% — {formatCurrency(c.budgetConsumed)}
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t('reports.includes')}>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>{t('reports.advancement')}</li>
            <li>{t('risks.title')}</li>
            <li>{t('reports.delays')}</li>
            <li>{t('modifications.title')}</li>
            <li>{t('reports.attendance')}</li>
            <li>{t('materials.title')}</li>
            <li>{t('tasks.title')}</li>
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="font-medium mb-4">
          {t('reports.generate')} — {types.find((x) => x.id === type)?.label}
        </h3>
        <ExportMenu onPdf={generate} onExcel={exportExcel} onCsv={exportCsv} />
      </Card>
    </div>
  );
}
