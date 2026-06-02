import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EditableTable } from '@/components/ui/EditableTable';
import { useDemoData } from '@/hooks/useDemoData';
import { dataStore } from '@/services/dataStore';
import type { FlooringRow } from '@/types';

export function FlooringPage() {
  const { t } = useTranslation();
  const { flooring, refresh } = useDemoData();
  const rowsKey = flooring.map((f) => f.id).join('|');

  const persist = (rows: Record<string, string | number>[]) => {
    dataStore.setFlooring(
      rows.map((r) => ({
        id: String(r.id),
        num: Number(r.num),
        zone: String(r.zone),
        color: String(r.color),
        surface: Number(r.surface),
        designation: String(r.designation),
        brand: String(r.brand),
        model: String(r.model),
        quantity: Number(r.quantity),
        observation: String(r.observation),
      })) as FlooringRow[]
    );
    refresh();
  };

  const columns = [
    { key: 'num', header: t('flooring.num'), type: 'number' as const },
    { key: 'zone', header: t('flooring.zone') },
    { key: 'color', header: t('flooring.color') },
    { key: 'surface', header: t('plans.surface'), type: 'number' as const },
    { key: 'designation', header: t('flooring.designation') },
    { key: 'brand', header: t('plans.brand') },
    { key: 'model', header: t('plans.model') },
    { key: 'quantity', header: t('plans.quantity'), type: 'number' as const },
    { key: 'observation', header: t('plans.observation') },
  ];

  return (
    <div>
      <PageHeader title={t('flooring.title')} />
      <PageQuickNav preset="ai" extra={[{ to: '/materiaux', labelKey: 'nav.materials' }]} />
      <Card>
        <FlooringWorkspace key={rowsKey} flooring={flooring} columns={columns} onSave={persist} saveLabel={t('common.save')} />
      </Card>
    </div>
  );
}

function FlooringWorkspace({
  flooring,
  columns,
  onSave,
  saveLabel,
}: {
  flooring: FlooringRow[];
  columns: Parameters<typeof EditableTable>[0]['columns'];
  onSave: (rows: Record<string, string | number>[]) => void;
  saveLabel: string;
}) {
  const initialRows = useMemo(
    () =>
      flooring.map((f) => ({
        id: f.id,
        num: f.num,
        zone: f.zone,
        color: f.color,
        surface: f.surface,
        designation: f.designation,
        brand: f.brand,
        model: f.model,
        quantity: f.quantity,
        observation: f.observation,
      })),
    [flooring]
  );
  const [rows, setRows] = useState(initialRows);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button type="button" onClick={() => onSave(rows)} className="px-4 py-2 text-sm rounded-lg bg-btp-600 text-white">
          {saveLabel}
        </button>
      </div>
      <EditableTable
        columns={columns}
        rows={rows}
        onChange={(next) => setRows(next as typeof initialRows)}
      />
    </>
  );
}
