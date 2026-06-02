import { QuickNav } from './QuickNav';
import { pageLinks } from '@/config/pageLinks';

type NavLink = { to: string; labelKey: string };

type Preset = 'core' | 'ai' | 'ops' | 'reports' | 'full';

const presets: Record<Preset, NavLink[]> = {
  core: [...pageLinks.core],
  ai: [...pageLinks.ai],
  ops: [...pageLinks.ops],
  reports: [...pageLinks.reports],
  full: [...pageLinks.core, ...pageLinks.ai.slice(0, 2)],
};

interface PageQuickNavProps {
  preset?: Preset;
  extra?: NavLink[];
}

export function PageQuickNav({ preset = 'core', extra = [] }: PageQuickNavProps) {
  return <QuickNav links={[...presets[preset], ...extra]} />;
}
