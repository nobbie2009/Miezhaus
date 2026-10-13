import { Lock, Star, X } from 'lucide-react';
import { useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { Tip } from '@/components/ui';
import { cn } from '@/utils/misc';
import { NAV } from './nav';
import { PHASES } from '@/game/progression';
import { GfxImage } from '@/features/graphics/Gfx';

export function Sidebar() {
  const s = useGs();
  const { page, navigate, favorites, toggleFavorite, sidebarOpen, setSidebar } = useUi();
  const phase = PHASES[s.phase - 1];
  const items = [...NAV].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)) || NAV.indexOf(a) - NAV.indexOf(b));
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <GfxImage id="ui.logo" className="h-9 w-9 object-contain" fallback={<img src="/favicon.svg" alt="" className="h-9 w-9" />} />
            <div>
              <div className="text-sm font-extrabold leading-tight tracking-tight">Mietshaus Tycoon</div>
              <div className="text-[11px] text-muted-fg">
                Phase {s.phase}: {phase.title}
              </div>
            </div>
          </div>
          <button className="rounded-md p-1 hover:bg-muted lg:hidden" onClick={() => setSidebar(false)} aria-label="Menü schließen">
            <X size={18} />
          </button>
        </div>
        <nav className="scroll-thin flex-1 overflow-y-auto px-2 pb-4" aria-label="Hauptnavigation">
          {items.map((it, idx) => {
            const locked = it.locked?.(s);
            const badge = it.badge?.(s);
            const fav = favorites.includes(it.id);
            const sepAfterFav = fav && !favorites.includes(items[idx + 1]?.id);
            const Icon = it.icon;
            const btn = (
              <div key={it.id} className={cn('group relative', sepAfterFav && 'mb-2 border-b border-border pb-2')}>
                <button
                  disabled={!!locked}
                  onClick={() => navigate(it.id)}
                  aria-current={page === it.id ? 'page' : undefined}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition', page === it.id ? 'bg-primary/10 font-semibold text-primary' : 'text-fg/80 hover:bg-muted hover:text-fg', locked && 'cursor-not-allowed opacity-45')}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="flex-1 truncate">{it.label}</span>
                  {locked ? (
                    <Lock size={13} />
                  ) : (
                    badge && <span className={cn('num min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-bold text-white', badge.tone === 'danger' ? 'bg-danger' : badge.tone === 'warning' ? 'bg-warning' : 'bg-primary')}>{badge.n}</span>
                  )}
                </button>
                {!locked && (
                  <button
                    onClick={() => toggleFavorite(it.id)}
                    className={cn('absolute right-[-2px] top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100', fav && 'opacity-60')}
                    aria-label={fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                    title={fav ? 'Favorit entfernen' : 'Als Favorit oben anheften'}
                  >
                    <Star size={11} className={fav ? 'fill-accent text-accent' : 'text-muted-fg'} />
                  </button>
                )}
              </div>
            );
            return locked ? (
              <Tip key={it.id} content={locked} side="right">
                {btn}
              </Tip>
            ) : (
              btn
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-3 text-[11px] leading-snug text-muted-fg">Spielsimulation – keine Rechts- oder Finanzberatung.</div>
      </aside>
    </>
  );
}
