import * as React from 'react';
import { Building2, CalendarDays, ChevronsRight, FastForward, HelpCircle, Menu, Pause, Play, Save, Search, SkipForward, Snowflake, Sun, Leaf, Flower2, Undo2, Bell } from 'lucide-react';
import { useGame, type Speed } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { Button, Tip } from '@/components/ui';
import { formatDateLong, SEASON_LABEL, seasonOf, toYmd, daysInMonth } from '@/utils/date';
import { temperature } from '@/game/weather';
import { AnimatedMoney } from '../common';
import { cn } from '@/utils/misc';

const SPEEDS: { id: Speed; label: string; icon: React.ReactNode; key: string }[] = [
  { id: 'paused', label: 'Pause', icon: <Pause size={15} />, key: 'Leertaste' },
  { id: 'normal', label: 'Normal', icon: <Play size={15} />, key: '1' },
  { id: 'fast', label: 'Schnell', icon: <FastForward size={15} />, key: '2' },
  { id: 'turbo', label: 'Sehr schnell', icon: <ChevronsRight size={15} />, key: '3' },
];

export function TopBar() {
  const s = useGame((x) => x.game)!;
  const { speed, setSpeed, advance, save, undo, undoLast, toast, dirty } = useGame();
  const { setSidebar, setSearch, setHelp, navigate, activePropertyId, setProperty } = useUi();
  const season = seasonOf(s.day);
  const temp = temperature(s.day, s.seed);
  const SeasonIcon = { winter: Snowflake, spring: Flower2, summer: Sun, autumn: Leaf }[season];
  const unread = s.messages.filter((m) => !m.read).length;

  const jump = React.useCallback(
    (days: number, label: string) => {
      const r = advance(days);
      if (r.reason === 'decision') toast('warning', `${label} unterbrochen nach ${r.days} Tag(en): Eine Entscheidung wartet.`);
      else if (r.reason === 'critical') toast('warning', `${label} unterbrochen nach ${r.days} Tag(en): kritisches Ereignis.`);
    },
    [advance, toast],
  );
  const toMonthEnd = () => {
    const { year, month, day } = toYmd(s.day);
    return daysInMonth(year, month) - day + 1;
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        setSpeed(useGame.getState().speed === 'paused' ? 'normal' : 'paused');
      } else if (e.key === '1') setSpeed('normal');
      else if (e.key === '2') setSpeed('fast');
      else if (e.key === '3') setSpeed('turbo');
      else if (e.key === 'n' || e.key === 'ArrowRight') jump(1, 'Tag');
      else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearch(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void save('manual');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLast();
      } else if (e.key === '?') setHelp(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump, setSpeed, setSearch, save, undoLast, setHelp]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebar(true)} aria-label="Menü öffnen">
          <Menu size={18} />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <SeasonIcon size={17} className="text-accent" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="num truncate text-sm font-semibold" data-testid="game-date">{formatDateLong(s.day)}</div>
            <div className="text-[11px] text-muted-fg">
              {SEASON_LABEL[season]} · {temp.toLocaleString('de-DE')} °C{s.properties.length === 0 && ` · ${s.building.name}`}
            </div>
          </div>
        </div>
        {s.properties.length > 0 && (
          <label className="flex items-center gap-1.5">
            <Building2 size={15} className="text-muted-fg" />
            <span className="sr-only">Objekt wählen</span>
            <select
              className="input h-9 max-w-[260px] py-0 text-sm"
              value={activePropertyId ?? s.building.id}
              onChange={(e) => setProperty(e.target.value === s.building.id ? null : e.target.value)}
              aria-label="Objekt wählen"
              data-testid="property-switcher"
            >
              {[s, ...s.properties].map((p) => (
                <option key={p.building.id} value={p.building.id}>
                  {p.building.name} · {p.apartments.length} WE
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Zeitsteuerung">
          {SPEEDS.map((sp) => (
            <Tip key={sp.id} content={`${sp.label} (${sp.key})`}>
              <button
                onClick={() => setSpeed(sp.id)}
                aria-pressed={speed === sp.id}
                aria-label={sp.label}
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition', speed === sp.id ? 'bg-card text-primary shadow-sm' : 'text-muted-fg hover:text-fg')}
              >
                {sp.icon}
              </button>
            </Tip>
          ))}
          <div className="mx-0.5 h-5 w-px bg-border" />
          <Tip content="Einen Tag vorwärts (N)">
            <button onClick={() => jump(1, 'Tag')} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-fg hover:bg-card hover:text-fg" data-testid="step-day">
              <SkipForward size={14} /> Tag
            </button>
          </Tip>
          <Tip content="Bis zum Monatsende vorspulen (stoppt bei Entscheidungen)">
            <button onClick={() => jump(toMonthEnd(), 'Monatsvorlauf')} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-fg hover:bg-card hover:text-fg" data-testid="step-month">
              <CalendarDays size={14} /> Monat
            </button>
          </Tip>
          <Tip content="Ein Jahr vorspulen (jeder Tag wird vollständig simuliert, stoppt bei Entscheidungen und kritischen Ereignissen)">
            <button onClick={() => jump(365, 'Jahresvorlauf')} className="hidden h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-fg hover:bg-card hover:text-fg sm:flex">
              Jahr
            </button>
          </Tip>
        </div>

        <div className="flex items-center gap-1">
          <Tip content="Kontostand – Klick öffnet die Finanzen">
            <button onClick={() => navigate('finance')} className="mr-1 rounded-lg px-2.5 py-1 text-right hover:bg-muted" data-testid="cash">
              <div className="text-[10px] font-medium uppercase text-muted-fg">Kontostand</div>
              <AnimatedMoney cents={s.cash} className="text-sm font-bold" />
            </button>
          </Tip>
          <Tip content="Nachrichten">
            <Button variant="ghost" size="icon" onClick={() => navigate('events')} aria-label="Nachrichten" className="relative">
              <Bell size={17} />
              {(unread > 0 || s.decisions.length > 0) && <span className={cn('absolute right-1 top-1 h-2.5 w-2.5 rounded-full', s.decisions.length ? 'animate-pulse-ring bg-danger' : 'bg-primary')} />}
            </Button>
          </Tip>
          <Tip content="Suche (Strg+K)">
            <Button variant="ghost" size="icon" onClick={() => setSearch(true)} aria-label="Suche">
              <Search size={17} />
            </Button>
          </Tip>
          <Tip content={undo ? `Rückgängig: ${undo.label} (Strg+Z)` : 'Nichts rückgängig zu machen'}>
            <span>
              <Button variant="ghost" size="icon" onClick={undoLast} disabled={!undo} aria-label="Rückgängig">
                <Undo2 size={17} />
              </Button>
            </span>
          </Tip>
          <Tip content={dirty ? 'Speichern (Strg+S) – ungespeicherte Änderungen' : 'Gespeichert'}>
            <Button variant="ghost" size="icon" onClick={() => void save('manual')} aria-label="Speichern" className="relative">
              <Save size={17} />
              {dirty && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
            </Button>
          </Tip>
          <Tip content="Hilfe & Spielmechanik (?)">
            <Button variant="ghost" size="icon" onClick={() => setHelp(true)} aria-label="Hilfe">
              <HelpCircle size={17} />
            </Button>
          </Tip>
        </div>
      </div>
    </header>
  );
}
