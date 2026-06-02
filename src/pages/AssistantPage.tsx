import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { askAssistant } from '@/services/fakeAi';
import { useLanguage } from '@/hooks/useLanguage';
import type { ChatMessage } from '@/types';
import { uid } from '@/utils/format';

const suggestionsFr = [
  'Où en est le chantier Résidence Les Lilas ?',
  'Sommes-nous en retard ?',
  'Respectons-nous le contrat ?',
  'Quels matériaux manquent ?',
  'Quels risques sont critiques ?',
  'Quels ouvriers sont absents ?',
  'Génère un rapport chantier.',
  'Génère une liste fournisseur.',
];

const suggestionsAr = [
  'أين وصلت ورشة Résidence Les Lilas؟',
  'هل نحن متأخرون؟',
  'هل نحترم العقد؟',
  'ما المواد الناقصة؟',
  'ما المخاطر الحرجة؟',
];

export function AssistantPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: lang === 'ar' ? 'مرحباً! أنا مساعد SmartChantier. اسألني عن ورشك.' : 'Bonjour ! Je suis l\'assistant SmartChantier. Posez-moi vos questions sur vos chantiers.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askAssistant(text, lang);
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', content: reply, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = lang === 'ar' ? suggestionsAr : suggestionsFr;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title={t('assistant.title')} subtitle={t('assistant.demoMode')} />
      <PageQuickNav preset="ai" />

      <Card className="flex-1 flex flex-col min-h-0 mb-4">
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${msg.role === 'user' ? 'bg-btp-600' : 'bg-cyan-600/30'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <p className={`text-sm p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-btp-800 text-white' : 'bg-btp-900/60 text-slate-300'}`}>
                {msg.content}
              </p>
            </div>
          ))}
          {loading && <LoadingBlock label={t('assistant.thinking')} />}
          <div ref={endRef} />
        </div>

        <div className="border-t border-btp-600/30 pt-3 mt-2">
          <p className="text-xs text-slate-500 mb-2">{t('assistant.suggestions')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="text-xs px-2 py-1 rounded-full bg-btp-800/80 text-slate-400 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder={t('assistant.placeholder')}
              className="flex-1 bg-btp-900/60 border border-btp-600/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-btp-500"
            />
            <Button onClick={() => send(input)} disabled={loading}>
              <Send className="w-4 h-4" />
              {t('assistant.send')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
