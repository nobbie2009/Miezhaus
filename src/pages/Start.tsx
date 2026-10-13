import * as React from 'react';
import { Building2, Flag, Infinity as InfinityIcon, Play, Sliders, Swords } from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, EuroInput, Field, Tabs, TooltipProvider } from '@/components/ui';
import { DEFAULT_SANDBOX, SCENARIOS, type SandboxOptions } from '@/content/scenarios';
import { SaveManager } from '@/features/saves/SaveManager';
import { listSaves, loadSave, type SaveMeta } from '@/persistence/db';
import { createGame } from '@/game/create';
import { BuildingView } from '@/features/building/BuildingView';
import type { Difficulty } from '@/game/config';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { Toasts } from '@/features/layout/Overlays';
import { GfxImage } from '@/features/graphics/Gfx';
import { useGfx } from '@/features/graphics/useGraphics';

type Mode = 'campaign' | 'endless' | 'challenge' | 'sandbox';

export function StartScreen() {
  const { newGame, loadGame, toast } = useGame();
  const navigate = useUi((x) => x.navigate);
  const [mode, setMode] = React.useState<Mode>('endless');
  const [difficulty, setDifficulty] = React.useState<Difficulty>('normal');
  const [last, setLast] = React.useState<SaveMeta | null>(null);
  const [sb, setSb] = React.useState<SandboxOptions>(DEFAULT_SANDBOX);
  const preview = React.useMemo(() => createGame({ scenarioId: 'endless_linden', seed: 7 }), []);
  React.useEffect(() => {
    listSaves()
      .then((l) => setLast(l.find((x) => !x.gameOver || x.gameOver === 'won') ?? null))
      .catch(() => setLast(null));
  }, []);
  const start = (scenarioId: string) => {
    newGame({ scenarioId, difficulty });
    navigate('overview');
  };
  const scenarios = SCENARIOS.filter((s) => s.mode === mode);
  const startBg = useGfx('bg.start');
  return (
    <TooltipProvider>
      <div className="relative min-h-full bg-gradient-to-b from-primary/10 via-bg to-bg">
        {startBg && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-cover bg-center opacity-25 dark:opacity-15" style={{ backgroundImage: `url(${startBg})`, maskImage: 'linear-gradient(to bottom, black 40%, transparent)' }} />}
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="flex items-center gap-3">
                <GfxImage id="ui.logo" className="h-14 w-14 object-contain" fallback={<img src="/favicon.svg" alt="" className="h-14 w-14" />} />
                <div>
                  <GfxImage id="ui.logo_wide" alt="Mietshaus Tycoon" className="h-12 w-auto" fallback={<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mietshaus Tycoon</h1>} />
                  <p className="text-sm text-muted-fg">Die Wirtschaftssimulation rund um ein Mietshaus</p>
                </div>
              </div>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-fg">
                Übernehmen Sie ein renovierungsbedürftiges Mietshaus. Vermieten Sie Wohnungen, wählen Sie passende Mieter, organisieren Sie Reparaturen, finanzieren Sie Modernisierungen – und halten Sie die Liquidität im Blick. Jede Wohnung ist eine kleine wirtschaftliche Einheit, das Haus ein zusammenhängendes System.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {last && (
                  <Button
                    size="lg"
                    onClick={async () => {
                      const r = await loadSave(last.id);
                      if (r.ok && r.state) {
                        loadGame(r.state);
                        navigate('overview');
                      } else toast('error', `Spielstand beschädigt: ${r.errors.join('; ')}`);
                    }}
                  >
                    <Play size={18} /> Fortsetzen: {last.building}
                  </Button>
                )}
                <Button size="lg" variant={last ? 'outline' : 'primary'} onClick={() => start('endless_linden')} data-testid="quick-start">
                  <Building2 size={18} /> Schnellstart Lindenstraße 14
                </Button>
              </div>
              {last && <p className="mt-2 text-xs text-muted-fg">Zuletzt: {last.name} · {formatDate(last.day)} · {formatMoney(last.cash, { decimals: false })}</p>}
            </div>
            <div className="rounded-2xl border border-border bg-card p-3 shadow-xl">
              <BuildingView s={preview} className="w-full text-fg" />
            </div>
          </div>

          <Card className="mt-10">
            <CardHeader title="Neues Spiel" actions={<Tabs value={difficulty} onChange={setDifficulty} items={[{ id: 'easy', label: 'Leicht' }, { id: 'normal', label: 'Normal' }, { id: 'hard', label: 'Schwer' }]} />} />
            <CardBody className="space-y-4">
              <Tabs
                value={mode}
                onChange={setMode}
                items={[
                  { id: 'endless', label: <span className="flex items-center gap-1.5"><InfinityIcon size={14} /> Endlos</span> },
                  { id: 'campaign', label: <span className="flex items-center gap-1.5"><Flag size={14} /> Kampagne</span> },
                  { id: 'challenge', label: <span className="flex items-center gap-1.5"><Swords size={14} /> Herausforderung</span> },
                  { id: 'sandbox', label: <span className="flex items-center gap-1.5"><Sliders size={14} /> Sandbox</span> },
                ]}
              />
              {mode !== 'sandbox' ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {scenarios.map((sc) => (
                    <button key={sc.id} onClick={() => start(sc.id)} className="group flex flex-col rounded-xl border border-border p-4 text-left transition hover:border-primary hover:shadow-md" data-testid={`scenario-${sc.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold group-hover:text-primary">{sc.title}</div>
                        <Badge tone={sc.difficultyLabel === 'Einsteiger' ? 'success' : sc.difficultyLabel === 'Mittel' ? 'info' : sc.difficultyLabel === 'Schwer' ? 'warning' : 'danger'}>{sc.difficultyLabel}</Badge>
                      </div>
                      <div className="text-xs text-muted-fg">{sc.subtitle}</div>
                      <p className="mt-2 flex-1 text-sm text-muted-fg">{sc.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                        <Badge>{sc.floors.reduce((a, r) => a + r.length, 0)} Wohnungen</Badge>
                        <Badge>Baujahr {sc.building.yearBuilt}</Badge>
                        <Badge>Start {formatMoney(sc.startCash, { decimals: false })}</Badge>
                        {sc.durationMonths && <Badge tone="warning">{sc.durationMonths} Monate</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Startkapital">
                    <EuroInput value={sb.startCash} onChange={(v) => setSb({ ...sb, startCash: v })} min={0} aria-label="Startkapital" />
                  </Field>
                  <Field label="Kreditrestschuld">
                    <EuroInput value={sb.loan} onChange={(v) => setSb({ ...sb, loan: v })} min={0} aria-label="Kredit" />
                  </Field>
                  <Field label={`Gebäudezustand: ${sb.buildingCondition} %`}>
                    <input type="range" min={10} max={95} value={sb.buildingCondition} onChange={(e) => setSb({ ...sb, buildingCondition: Number(e.target.value) })} className="accent-[hsl(var(--primary))]" aria-label="Gebäudezustand" />
                  </Field>
                  <Field label={`Vermietungsquote: ${Math.round(sb.occupancy * 100)} %`}>
                    <input type="range" min={0} max={1} step={0.1} value={sb.occupancy} onChange={(e) => setSb({ ...sb, occupancy: Number(e.target.value) })} className="accent-[hsl(var(--primary))]" aria-label="Vermietungsquote" />
                  </Field>
                  <Field label={`Ereignishäufigkeit: ${Math.round(sb.eventFrequency * 100)} %`}>
                    <input type="range" min={0} max={2} step={0.25} value={sb.eventFrequency} onChange={(e) => setSb({ ...sb, eventFrequency: Number(e.target.value) })} className="accent-[hsl(var(--primary))]" aria-label="Ereignishäufigkeit" />
                  </Field>
                  <label className="flex items-center gap-2 self-end text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={sb.allUnlocked} onChange={(e) => setSb({ ...sb, allUnlocked: e.target.checked })} /> Alle Maßnahmen freischalten
                  </label>
                  <div className="md:col-span-3">
                    <Button
                      onClick={() => {
                        newGame({ scenarioId: 'sandbox', sandbox: { ...sb, difficulty }, difficulty });
                        navigate('overview');
                      }}
                    >
                      <Play size={15} /> Sandbox starten
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Spielstände laden" subtitle="Lokal in diesem Browser gespeichert · Export/Import als JSON-Datei" />
            <CardBody>
              <SaveManager onLoaded={() => navigate('overview')} />
            </CardBody>
          </Card>
          <p className={cn('mt-8 text-center text-xs text-muted-fg')}>Mietshaus Tycoon · läuft vollständig lokal, ohne Registrierung und ohne Cloud-Dienste · Spielsimulation, keine Rechts- oder Finanzberatung.</p>
        </div>
        <Toasts />
      </div>
    </TooltipProvider>
  );
}
