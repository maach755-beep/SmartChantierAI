import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Package,
  Sparkles,
  Camera,
  FileImage,
  ScanLine,
  Layers,
  HardHat,
  FileEdit,
  AlertTriangle,
  FileCheck,
  ClipboardList,
  Truck,
  Calendar,
  Smartphone,
  GitCompare,
  FileText,
  Files,
  Bot,
  ClipboardCheck,
  ShoppingCart,
  Search,
  Brain,
  Wallet,
  Settings,
  UserCog,
  Library,
  FileSpreadsheet,
  ScrollText,
  TrendingUp,
  BookOpen,
  Timer,
  Building2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

type NavItem = { path: string; icon: React.ComponentType<{ className?: string }>; key: string };

const navSections: { sectionKey: string; items: NavItem[] }[] = [
  {
    sectionKey: 'sectionMain',
    items: [{ path: '/', icon: LayoutDashboard, key: 'dashboard' }],
  },
  {
    sectionKey: 'sectionProjects',
    items: [
      { path: '/projets', icon: FolderKanban, key: 'projects' },
      { path: '/taches', icon: ListTodo, key: 'tasks' },
      { path: '/suivi', icon: HardHat, key: 'siteTracking' },
      { path: '/equipe', icon: Users, key: 'team' },
      { path: '/materiaux', icon: Package, key: 'materials' },
      { path: '/documents', icon: Files, key: 'documents' },
    ],
  },
  {
    sectionKey: 'sectionAi',
    items: [
      { path: '/analyse-ia', icon: Sparkles, key: 'aiAnalysis' },
      { path: '/plan-extraction', icon: ScanLine, key: 'planExtraction' },
      { path: '/plans', icon: FileImage, key: 'planAnalysis' },
      { path: '/photos', icon: Camera, key: 'photos' },
      { path: '/photo-comparison', icon: GitCompare, key: 'photoCompare' },
      { path: '/assistant', icon: Bot, key: 'assistant' },
      { path: '/analyse-situation-chantier', icon: ClipboardCheck, key: 'situationAnalysis' },
      { path: '/assistant-achat', icon: ShoppingCart, key: 'purchaseAssistant' },
    ],
  },
  {
    sectionKey: 'sectionOps',
    items: [
      { path: '/modifications', icon: FileEdit, key: 'modifications' },
      { path: '/risques', icon: AlertTriangle, key: 'risks' },
      { path: '/contrat', icon: FileCheck, key: 'contract' },
      { path: '/pointage', icon: ClipboardList, key: 'attendance' },
      { path: '/fournisseurs', icon: Truck, key: 'suppliers' },
      { path: '/finances', icon: Wallet, key: 'finance' },
      { path: '/planning', icon: Calendar, key: 'planning' },
      { path: '/terrain', icon: Smartphone, key: 'fieldToOffice' },
    ],
  },
  {
    sectionKey: 'sectionBi',
    items: [
      { path: '/assistant-directeur-ia', icon: UserCog, key: 'directorAssistant' },
      { path: '/bibliotheque-materiaux', icon: Library, key: 'materialsLibrary' },
      { path: '/assistant-devis-ia', icon: FileSpreadsheet, key: 'devisAssistant' },
      { path: '/assistant-fiche-technique', icon: ScrollText, key: 'techSheetAssistant' },
      { path: '/centre-rentabilite', icon: TrendingUp, key: 'profitabilityCenter' },
      { path: '/journal-chantier-ia', icon: BookOpen, key: 'siteJournal' },
      { path: '/detection-retard', icon: Timer, key: 'delayDetection' },
    ],
  },
  {
    sectionKey: 'sectionMore',
    items: [
      { path: '/revetements', icon: Layers, key: 'flooring' },
      { path: '/rapports', icon: FileText, key: 'reports' },
      { path: '/recherche', icon: Search, key: 'search' },
      { path: '/pilotage', icon: Brain, key: 'siteDirector' },
      { path: '/parametres', icon: Settings, key: 'settings' },
    ],
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const widthClass = collapsed ? 'w-[4.5rem]' : 'w-64';

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 start-4 z-50 p-2 rounded-lg bg-btp-800 border border-btp-500/30 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 start-0 z-40 h-screen flex flex-col bg-gradient-to-b from-btp-950 via-btp-900/95 to-btp-950 border-e border-btp-500/25 shadow-xl shadow-black/20 transition-all duration-300 ease-in-out ${widthClass} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`flex items-center border-b border-btp-500/20 ${collapsed ? 'p-3 justify-center' : 'p-4 gap-2'}`}>
          <div className="p-2 rounded-xl bg-gradient-to-br from-btp-600 to-cyan-600 shadow-lg shadow-btp-600/30 shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm truncate">{t('app.name')}</p>
              <p className="text-[10px] text-slate-500 truncate">{t('app.tagline')}</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-btp-800/80 text-slate-400 hover:text-white shrink-0"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
          {navSections.map(({ sectionKey, items }) => (
            <div key={sectionKey} className="mb-1">
              {!collapsed && (
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {t(`nav.${sectionKey}`)}
                </p>
              )}
              {items.map(({ path, icon: Icon, key }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  title={collapsed ? t(`nav.${key}`) : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-sm transition-all ${
                      collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-btp-600/50 to-cyan-600/25 text-white border border-btp-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-btp-800/60 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{t(`nav.${key}`)}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-btp-500/20 space-y-1">
            <span className="text-[10px] text-cyan-400/80 uppercase tracking-wider block">SmartChantier v4</span>
            <span className="text-[10px] text-slate-500 block">{t('app.tagline')}</span>
          </div>
        )}
      </aside>
    </>
  );
}
