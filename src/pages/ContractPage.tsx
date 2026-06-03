import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlatformData } from '@/hooks/usePlatformData';
import { computeCompliance } from '@/utils/compliance';
import { formatCurrency } from '@/utils/format';

export function ContractPage() {
  const { t } = useTranslation();
  const { chantiers, modifications, tasks } = usePlatformData();
  const [selectedId, setSelectedId] = useState(chantiers[0]?.id ?? '');
  const ch = chantiers.find((c) => c.id === selectedId);
  const compliance = ch ? computeCompliance(ch, tasks, modifications) : null;

  const alerts = ch && compliance
    ? [
        compliance.delayDays > 5 && { msg: `Retard ${compliance.delayDays} j sur planning contractuel` },
        compliance.missingMaterials > 0 && {
          msg: `${compliance.missingMaterials} matériaux manquants vs contrat`,
        },
        compliance.unvalidatedMods > 0 && {
          msg: `${compliance.unvalidatedMods} modifications non validées`,
        },
        compliance.missingTasks > 0 && { msg: `${compliance.missingTasks} tâches non réalisées` },
      ].filter(Boolean) as { msg: string }[]
    : [];

  return (
    <div>
      <PageHeader title={t('contract.title')} />
      <PageQuickNav preset="core" />

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="mb-4 bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-slate-200 w-full max-w-md"
      >
        {chantiers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {ch && compliance && (
        <>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card title={t('contract.initial')}>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• 120 tâches contractuelles</li>
                <li>• Budget : {formatCurrency(ch.budgetPlanned)}</li>
                <li>• Délai contractuel : {ch.endDate}</li>
                <li>• 45 pièces référencées</li>
                <li>• Matériaux spécifiés : 28 familles</li>
              </ul>
            </Card>
            <Card title={t('contract.actual')}>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>
                  • {tasks.filter((tk) => tk.chantierId === ch.id && tk.status === 'done').length} tâches
                  terminées
                </li>
                <li>
                  • Budget consommé : {Math.round((ch.budgetConsumed / ch.budgetPlanned) * 100)}%
                </li>
                <li>• Retard réel : {ch.delayDays} jours</li>
                <li>• Progression : {ch.progress}%</li>
                <li>• Non-conformités détectées : {alerts.length}</li>
              </ul>
            </Card>
          </div>

          <Card title={t('contract.compliance')} className="mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-5xl font-bold text-btp-300">{compliance.score}%</div>
              <div className="flex-1 min-w-[200px] h-4 bg-btp-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-btp-600 to-cyan-500 transition-all"
                  style={{ width: `${compliance.score}%` }}
                />
              </div>
              <Badge variant={compliance.score >= 85 ? 'green' : compliance.score >= 65 ? 'orange' : 'red'}>
                {compliance.score >= 85 ? (
                  <CheckCircle2 className="w-3 h-3 inline me-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 inline me-1" />
                )}
                {compliance.score >= 85 ? 'Conforme' : compliance.score >= 65 ? 'Partiel' : 'Non conforme'}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm text-slate-400">
              <p>
                {t('contract.missingTasks')}: {compliance.missingTasks}
              </p>
              <p>
                {t('contract.missingMaterials')}: {compliance.missingMaterials}
              </p>
              <p>
                {t('contract.unvalidatedMods')}: {compliance.unvalidatedMods}
              </p>
            </div>
          </Card>

          <Card title={t('contract.alerts')}>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-green-400">{t('contract.noAlerts')}</p>
              ) : (
                alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    {a.msg}
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
