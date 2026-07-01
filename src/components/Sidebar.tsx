import { Filter, RotateCcw } from 'lucide-react';
import { GlobalFilters } from '@/features/filters/components/GlobalFilters';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import { publicUrl } from '@/shared/publicUrl';
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
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-3xl bg-[#05080d] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_45px_rgba(0,0,0,0.28)]">
        <img
          src={publicUrl('/assets/preferenza-logo.png')}
          alt="Preferenza"
          className="block h-full w-full select-none rounded-2xl object-cover object-center"
          draggable={false}
        />
      </div>

      <nav className="mt-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                isActive
                  ? 'bg-signal-blue/15 text-white ring-1 ring-signal-blue/40'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition ${
                  isActive ? 'text-signal-blue opacity-100' : 'text-slate-500 opacity-80'
                }`}
                strokeWidth={1.8}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-1 block truncate text-xs opacity-70">{item.description}</span>
              </span>
            </button>
          );
        })}
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
