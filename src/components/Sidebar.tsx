import { Filter, RotateCcw } from 'lucide-react';
import { GlobalFilters } from '@/features/filters/components/GlobalFilters';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { NavigationItem, PageId } from '@/types/navigation';

interface SidebarProps {
  activePage: PageId;
  navigation: NavigationItem[];
  onNavigate: (pageId: PageId) => void;
}

export function Sidebar({ activePage, navigation, onNavigate }: SidebarProps) {
  const resetFilters = useGlobalFilterStore((state) => state.resetFilters);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-80 flex-col border-r border-white/10 bg-graphite-950/90 p-5 backdrop-blur-2xl">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="font-display text-xl font-semibold text-white">LIC</div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Centro executivo de custo, eficiência e resultado logístico.
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`w-full rounded-2xl px-4 py-3 text-left transition ${
              activePage === item.id
                ? 'bg-signal-blue/15 text-white ring-1 ring-signal-blue/40'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <div className="text-sm font-bold">{item.label}</div>
            <div className="mt-1 text-xs opacity-70">{item.description}</div>
          </button>
        ))}
      </nav>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-signal-amber/50 hover:text-signal-amber"
          aria-label="Resetar filtros"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <GlobalFilters />
    </aside>
  );
}
