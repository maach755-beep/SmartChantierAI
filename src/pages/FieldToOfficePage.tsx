import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Package, Clock, Send, ImagePlus } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';
import { dataStore } from '@/services/dataStore';
import { analyzeFieldPhoto } from '@/services/fakeAi';
import { formatCurrency } from '@/utils/format';
import type { FieldUpdate } from '@/types';

export function FieldToOfficePage() {
  const { t } = useTranslation();
  const { fieldUpdates, chantiers, refresh } = useDemoData();
  const [updates, setUpdates] = useState(fieldUpdates);
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? '');
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const chantier = chantiers.find((c) => c.id === chantierId);

  const validate = (id: string, status: FieldUpdate['status']) => {
    const next = updates.map((u) => (u.id === id ? { ...u, status } : u));
    setUpdates(next);
    dataStore.setFieldUpdates(next);
    refresh();
  };

  const sendUpdate = useCallback(async (type: FieldUpdate['type'], content: string, photoUrl?: string) => {
    const ai = type === 'photo' || type === 'modification' ? await analyzeFieldPhoto() : undefined;
    const newUpdate: FieldUpdate = {
      id: `field_${crypto.randomUUID()}`,
      chantierId,
      chantierName: chantier?.name ?? 'Chantier',
      sender: chantier?.manager ?? 'Chef de chantier',
      date: new Date().toISOString(),
      type,
      content,
      photoUrl,
      status: 'pending',
      aiAnalysis: ai,
    };
    const next = [newUpdate, ...updates];
    setUpdates(next);
    dataStore.setFieldUpdates(next);
    setComment('');
    setPreview(null);
  }, [chantier, chantierId, updates]);

  const handlePhoto = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    void sendUpdate('photo', t('field.photoUploaded'), url);
  };

  const triggerFileInput = useCallback(() => {
    fileRef.current?.click();
  }, []);

  return (
    <div className="max-w-2xl mx-auto lg:max-w-none">
      <PageHeader title={t('field.title')} subtitle={t('field.subtitle')} />
      <PageQuickNav preset="ai" extra={[{ to: '/photos', labelKey: 'nav.photos' }]} />

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <select
          value={chantierId}
          onChange={(e) => setChantierId(e.target.value)}
          className="flex-1 min-w-[200px] bg-btp-900 border border-btp-600/30 rounded-xl px-4 py-3 text-sm"
        >
          {chantiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Link
          to="/photo-comparison"
          className="text-xs text-cyan-400 hover:underline px-2"
        >
          {t('nav.photoCompare')} →
        </Link>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePhoto(f);
        }}
      />

      {preview && (
        <img src={preview} alt="" className="w-full h-48 object-cover rounded-xl mb-4 border border-btp-500/30" />
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <FieldAction icon={Camera} label={t('field.takePhoto')} onClick={triggerFileInput} />
        <FieldAction icon={ImagePlus} label={t('field.uploadPhoto')} onClick={triggerFileInput} />
        <FieldAction icon={Clock} label={t('field.reportDelay')} onClick={() => void sendUpdate('delay', t('field.delayReport'))} />
        <FieldAction icon={Package} label={t('field.reportMaterial')} onClick={() => void sendUpdate('material', t('field.materialReport'))} />
      </div>

      <Card className="mb-6">
        <label className="text-xs text-slate-500">{t('field.addComment')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full mt-2 px-3 py-2 rounded-xl bg-btp-900/60 border border-btp-600/30 text-sm resize-none"
        />
        <Button
          className="mt-3 w-full"
          onClick={() => comment && sendUpdate('comment', comment)}
          disabled={!comment.trim()}
        >
          <Send className="w-4 h-4" />
          {t('field.sendUpdate')}
        </Button>
      </Card>

      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
        Bureau — {t('field.receivedUpdates')}
      </h3>
      <div className="space-y-4">
        {updates.map((u) => (
          <Card key={u.id}>
            <div className="flex flex-col gap-4">
              {u.photoUrl && (
                <img src={u.photoUrl} alt="" className="w-full h-40 object-cover rounded-xl" />
              )}
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="blue">{u.chantierName}</Badge>
                  <Badge variant="gray">{u.type}</Badge>
                  <span className="text-xs text-slate-500">
                    {u.sender} — {new Date(u.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{u.content}</p>
                {u.aiAnalysis && (
                  <div className="mt-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm">
                    <p className="font-medium text-cyan-400 mb-1">{t('field.aiAnalysis')}</p>
                    <p>Pièce : {u.aiAnalysis.affectedRoom}</p>
                    <p>Impact budget : {formatCurrency(u.aiAnalysis.budgetImpact)}</p>
                    <p>Impact délai : {u.aiAnalysis.delayImpact} j</p>
                    <p>{u.aiAnalysis.materialImpact}</p>
                  </div>
                )}
                {u.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="success" onClick={() => validate(u.id, 'validated')}>
                      {t('common.validate')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => validate(u.id, 'rejected')}>
                      {t('common.reject')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => validate(u.id, 'clarification')}>
                      {t('field.askPrecision')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FieldAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card rounded-2xl p-5 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform hover:border-cyan-500/40"
    >
      <Icon className="w-9 h-9 text-cyan-400" />
      <span className="text-sm text-slate-300 text-center">{label}</span>
    </button>
  );
}
