import * as React from 'react';
import { AlertOctagon, CheckCircle2, Info, PartyPopper, Search, TriangleAlert, X, GraduationCap } from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { useGs } from '@/hooks/useGameState';
import { useUi, type PageId } from '@/store/uiStore';
import { Badge, Button, Modal } from '@/components/ui';
import { DEFECT_TYPES } from '@/content/defects';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { NAV } from './nav';
import { computeScore, scoreGrade } from '@/game/score';
import { targetLabel } from '@/game/defects';
import { GfxImage } from '@/features/graphics/Gfx';

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertOctagon : t.kind === 'warning' ? TriangleAlert : Info;
        return (
          <div key={t.id} className={cn('pointer-events-auto flex animate-fade-in items-start gap-2.5 rounded-xl border bg-card p-3 text-sm shadow-lg', t.kind === 'error' ? 'border-danger/40' : t.kind === 'success' ? 'border-success/40' : t.kind === 'warning' ? 'border-warning/40' : 'border-border')}>
            <Icon size={17} className={cn('mt-0.5 shrink-0', t.kind === 'error' ? 'text-danger' : t.kind === 'success' ? 'text-success' : t.kind === 'warning' ? 'text-warning' : 'text-info')} />
            <span className="flex-1">{t.text}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Schließen" className="text-muted-fg hover:text-fg">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Zeigt offene Entscheidungen, sobald das Spiel pausiert ist. */
export function DecisionModal() {
  const s = useGame((x) => x.game)!;
  const speed = useGame((x) => x.speed);
  const dispatch = useGame((x) => x.dispatch);
  const busy = useGame((x) => x.busy);
  const [dismissed, setDismissed] = React.useState<string | null>(null);
  const d = s.decisions[0];
  const open = !!d && speed === 'paused' && dismissed !== d.id && !s.gameOver;
  if (!d) return null;
  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && setDismissed(d.id)}
      title={
        <span className="flex items-center gap-2">
          {d.severity === 'danger' ? <AlertOctagon size={18} className="text-danger" /> : d.severity === 'warning' ? <TriangleAlert size={18} className="text-warning" /> : <Info size={18} className="text-info" />}
          {d.title}
        </span>
      }
      description={`Entscheidung bis ${formatDate(d.expiresDay)} – danach gilt automatisch die Standardoption.${s.decisions.length > 1 ? ` (${s.decisions.length - 1} weitere offen)` : ''}`}
    >
      <GfxImage id={`event.${d.eventId}`} fallbackId="event.generic" className="mb-4 aspect-[12/5] w-full rounded-xl object-cover" />
      <p className="mb-4 text-sm leading-relaxed">{d.text}</p>
      <div className="space-y-2">
        {d.options.map((o) => (
          <button
            key={o.id}
            disabled={busy}
            onClick={() => dispatch({ type: 'resolveDecision', decisionId: d.id, optionId: o.id })}
            className="w-full rounded-xl border border-border p-3 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2 text-sm font-semibold">
              {o.label}
              {o.id === d.defaultOptionId && <Badge>Standard</Badge>}
            </div>
            <div className="mt-0.5 text-xs text-muted-fg">{o.description}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function GameOverModal() {
  const s = useGame((x) => x.game)!;
  const dispatch = useGame((x) => x.dispatch);
  const close = useGame((x) => x.closeGame);
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => setHidden(false), [s.gameOver?.day]);
  if (!s.gameOver) return null;
  const g = s.gameOver;
  const score = computeScore(s);
  return (
    <Modal
      open={!hidden}
      onOpenChange={(v) => !v && setHidden(true)}
      title={
        <span className="flex items-center gap-2">
          {g.kind === 'won' ? <PartyPopper size={20} className="text-success" /> : <AlertOctagon size={20} className="text-danger" />}
          {g.title}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hauptmenü
          </Button>
          {g.kind !== 'insolvency' && <Button onClick={() => dispatch({ type: 'continueEndless' })}>Im Endlosmodus weiterspielen</Button>}
        </>
      }
    >
      <p className="text-sm leading-relaxed">{g.text}</p>
      <div className="mt-4 rounded-xl bg-muted p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-fg">Gesamtbewertung</span>
          <span className="num text-2xl font-extrabold">{score.total}</span>
        </div>
        <div className="text-right text-xs font-semibold text-primary">{scoreGrade(score.total)}</div>
      </div>
    </Modal>
  );
}

interface SearchHit {
  id: string;
  label: string;
  sub: string;
  page: PageId;
  focus?: string;
}

export function SearchPalette() {
  const s = useGs();
  const { searchOpen, setSearch, navigate } = useUi();
  const [q, setQ] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (searchOpen) {
      setQ('');
      setIdx(0);
    }
  }, [searchOpen]);
  const hits = React.useMemo<SearchHit[]>(() => {
    const all: SearchHit[] = [
      ...NAV.filter((n) => !n.locked?.(s)).map((n) => ({ id: `p-${n.id}`, label: n.label, sub: 'Bereich', page: n.id })),
      ...s.apartments.map((a) => ({ id: a.id, label: `Wohnung ${a.number}`, sub: `${a.area} m² · ${a.rooms} Zi.`, page: 'apartments' as PageId, focus: a.id })),
      ...s.tenants.filter((t) => t.status !== 'former').map((t) => ({ id: t.id, label: t.name, sub: `Mieter · ${t.occupation}`, page: 'tenants' as PageId, focus: t.id })),
      ...s.defects.filter((d) => d.resolvedDay === null && d.discovered).map((d) => ({ id: d.id, label: DEFECT_TYPES[d.type].label, sub: `Schaden · ${targetLabel(s, d.target)}`, page: 'repairs' as PageId, focus: d.id })),
      ...s.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress').map((j) => ({ id: j.id, label: j.title, sub: 'Auftrag', page: 'repairs' as PageId, focus: j.id })),
      ...s.contractors.map((c) => ({ id: c.id, label: c.name, sub: 'Dienstleister', page: 'staff' as PageId })),
    ];
    const t = q.trim().toLowerCase();
    return (t ? all.filter((h) => h.label.toLowerCase().includes(t) || h.sub.toLowerCase().includes(t)) : all).slice(0, 12);
  }, [q, s]);
  const go = (h: SearchHit) => {
    navigate(h.page, h.focus ?? null);
    setSearch(false);
  };
  return (
    <Modal open={searchOpen} onOpenChange={setSearch} title="Suche" description="Wohnungen, Mieter, Schäden, Aufträge und Bereiche">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
        <input
          autoFocus
          className="input pl-9"
          placeholder="Suchen …"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setIdx((i) => Math.min(hits.length - 1, i + 1));
            if (e.key === 'ArrowUp') setIdx((i) => Math.max(0, i - 1));
            if (e.key === 'Enter' && hits[idx]) go(hits[idx]);
          }}
          aria-label="Suchbegriff"
        />
      </div>
      <ul className="mt-3 space-y-1">
        {hits.map((h, i) => (
          <li key={h.id}>
            <button onClick={() => go(h)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm', i === idx ? 'bg-primary/10' : 'hover:bg-muted')}>
              <span className="font-medium">{h.label}</span>
              <span className="text-xs text-muted-fg">{h.sub}</span>
            </button>
          </li>
        ))}
        {!hits.length && <li className="py-4 text-center text-sm text-muted-fg">Nichts gefunden.</li>}
      </ul>
    </Modal>
  );
}

const TUTORIAL: { title: string; text: string; page?: PageId; button?: string }[] = [
  { title: 'Willkommen, Vermieter!', text: 'Die Übersicht zeigt Kontostand, Mieteingänge, Leerstand, Zufriedenheit und Warnungen. Jede Warnung basiert auf echten Zahlen und bietet eine Handlungsmöglichkeit.', page: 'overview' },
  { title: 'Leerstand vermeiden', text: 'Unter „Wohnungen“ können Sie freie Wohnungen inserieren. Bewerber erscheinen in den nächsten Tagen – vergleichen Sie Einkommen, Bonität und Passung, bevor Sie einen Vertrag anbieten.', page: 'apartments', button: 'Zu den Wohnungen' },
  { title: 'Schäden beheben', text: 'Unter „Reparaturen“ sehen Sie gemeldete Schäden. Vergleichen Sie Angebote: Der günstigste Betrieb ist nicht immer der beste. Unbehandelte Schäden können teure Folgeschäden verursachen.', page: 'repairs', button: 'Zu den Reparaturen' },
  { title: 'Die Zeit steuern', text: 'Oben rechts starten Sie die Zeit (Leertaste), spulen einen Tag, einen Monat oder ein Jahr vor. Jeder Tag wird vollständig simuliert – bei wichtigen Entscheidungen hält das Spiel automatisch an.' },
  { title: 'Monatsabschluss & Finanzen', text: 'Am Monatsende werden Energie, Fixkosten und Kreditraten gebucht. Unter „Finanzen“ finden Sie das vollständige Buchungsjournal, die Liquiditätsprognose und Kredite.', page: 'finance', button: 'Zu den Finanzen' },
  { title: 'Ziele & Phasen', text: 'Ihr Fortschritt verläuft in fünf Phasen – vom Überleben bis zur Meisterschaft. Neue Phasen schalten neue Möglichkeiten frei. Viel Erfolg!', page: 'goals', button: 'Zu den Zielen' },
];

export function Tutorial() {
  const s = useGame((x) => x.game)!;
  const dispatch = useGame((x) => x.dispatch);
  const navigate = useUi((x) => x.navigate);
  const step = s.tutorialStep;
  if (step < 0 || step >= TUTORIAL.length) return null;
  const t = TUTORIAL[step];
  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[min(360px,calc(100vw-2rem))] animate-fade-in rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl lg:left-[17rem]" role="dialog" aria-label="Tutorial">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <GraduationCap size={14} /> Tutorial {step + 1}/{TUTORIAL.length}
        </span>
        <button className="text-xs text-muted-fg hover:text-fg" onClick={() => dispatch({ type: 'setTutorialStep', step: -1 })}>
          Überspringen
        </button>
      </div>
      <div className="text-sm font-semibold">{t.title}</div>
      <p className="mt-1 text-sm leading-relaxed text-muted-fg">{t.text}</p>
      <div className="mt-3 flex justify-end gap-2">
        {t.button && t.page && (
          <Button size="sm" variant="outline" onClick={() => navigate(t.page!)}>
            {t.button}
          </Button>
        )}
        <Button size="sm" onClick={() => dispatch({ type: 'setTutorialStep', step: step + 1 >= TUTORIAL.length ? -1 : step + 1 })}>
          {step + 1 >= TUTORIAL.length ? 'Fertig' : 'Weiter'}
        </Button>
      </div>
    </div>
  );
}

export function HelpDialog() {
  const { helpOpen, setHelp } = useUi();
  const sections: [string, string][] = [
    ['Zeit', 'Ein Spieltag simuliert Verschleiß, Schäden, Handwerkerfortschritt, Mieterverhalten, Zahlungen und Energieverbrauch. Am Monatsende werden Betriebskosten, Kreditraten und ein Monatsbericht erstellt. Lange Vorläufe berechnen jeden Tag einzeln und stoppen bei Entscheidungen.'],
    ['Mieten & Zahlungen', `Am 1. jedes Monats entstehen Mietforderungen (fällig am 3.). Mieter zahlen pünktlich, verspätet oder teilweise – abhängig von individueller Zuverlässigkeit und finanzieller Lage. Mahnungen (Erinnerung → Mahnung → Anwalt) erhöhen die Zahlungsbereitschaft, belasten aber das Verhältnis. Bei offenen Mängeln mindern Mieter die Miete.`],
    ['Nebenkosten', 'Mieter leisten monatliche Vorauszahlungen. Heizung, Wasser, Müll, Reinigung, Garten, Versicherung, Grundsteuer und 70 % der Hausmeisterkosten sind umlagefähig. Im März wird das Vorjahr abgerechnet: Nachzahlungen werden zu Forderungen, Guthaben werden erstattet. Den Anteil leerstehender Wohnungen tragen Sie selbst.'],
    ['Mieterhöhungen', `Vereinfachtes Spielregelwerk: höchstens bis zur Vergleichsmiete, maximal +20 % in drei Jahren, frühestens 12 Monate nach der letzten Anpassung, wirksam nach drei Monaten. Nach Modernisierungen sind 8 % der Kosten pro Jahr umlegbar (max. 3 €/m²). Bei Neuvermietung höchstens Vergleichsmiete + 10 %. Keine Rechtsberatung!`],
    ['Gebäude & Schäden', 'Bauteile altern unabhängig. Je schlechter der Zustand, desto wahrscheinlicher entstehen Schäden – manche zunächst unentdeckt. Unbehandelte Schäden können nach einer Frist zu Folgeschäden eskalieren (z. B. lose Ziegel → undichtes Dach → Wasserschaden). Wartungen bremsen den Verschleiß für 12 Monate.'],
    ['Zufriedenheit', 'Jeder Mieter bewertet Miete, Zustand, Ausstattung, Sauberkeit, Mängel, Baulärm, Heizkosten, Sicherheit, Service und persönliche Bedürfnisse – gewichtet nach seiner Persönlichkeit. Die Zufriedenheit folgt dem Zielwert träge. Unter 35 % steigt die Kündigungswahrscheinlichkeit stark.'],
    ['Liquidität', 'Der Immobilienwert ist kein verfügbares Geld. Fällt der Kontostand unter den Dispositionsrahmen und bleibt dort 45 Tage, ist das Spiel verloren. Die Liquiditätsprognose zeigt die erwartete Entwicklung der nächsten 30 Tage.'],
    ['Energie', 'Der Heizbedarf hängt von Außentemperatur, Dämmung, Fenstern, Anlage, Wartung und Mieterverhalten ab. Energetische Maßnahmen senken vor allem die Nebenkosten der Mieter – das steigert Zufriedenheit, Vergleichsmiete und Marktwert.'],
    ['Bewertung', 'Die Gesamtbewertung (0–1000) berücksichtigt Liquidität, technischen Zustand, Instandhaltungsrückstand, Zufriedenheit, Energieeffizienz, Leerstand, Verschuldung, Nachhaltigkeit und Widerstandsfähigkeit. Reines Gewinnmaximieren lohnt sich nicht dauerhaft.'],
    ['Tastenkürzel', 'Leertaste: Pause/Start · 1/2/3: Geschwindigkeit · N oder →: ein Tag · Strg+K: Suche · Strg+S: Speichern · Strg+Z: Rückgängig · ?: Hilfe'],
  ];
  return (
    <Modal open={helpOpen} onOpenChange={setHelp} title="Hilfe & Spielmechanik" wide>
      <div className="space-y-4">
        {sections.map(([h, t]) => (
          <section key={h}>
            <h3 className="text-sm font-semibold">{h}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-fg">{t}</p>
          </section>
        ))}
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-fg">Mietshaus Tycoon ist eine Spielsimulation. Alle rechtlichen und steuerlichen Regeln sind stark vereinfacht und stellen keine Rechts-, Steuer- oder Finanzberatung dar.</p>
      </div>
    </Modal>
  );
}

export const moneyFmt = formatMoney;
