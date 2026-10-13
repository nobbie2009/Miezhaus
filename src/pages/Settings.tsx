import * as React from 'react';
import { Bot, Gamepad2, HardDrive, LogOut, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, Confirm, Field, Tabs } from '@/components/ui';
import { SaveManager } from '@/features/saves/SaveManager';
import { SCENARIO_BY_ID } from '@/content/scenarios';
import { ollamaProvider } from '@/ai/textProvider';
import { GraphicsStatus } from '@/features/graphics/GraphicsStatus';
import { Image as ImageIcon } from 'lucide-react';

export function SettingsPage() {
  const s = useGs();
  const dispatch = useDispatch();
  const { newGame, closeGame, save } = useGame();
  const ui = useUi();
  const [restart, setRestart] = React.useState(false);
  const [name, setName] = React.useState(s.saveName);
  const [aiStatus, setAiStatus] = React.useState<string | null>(null);
  const baseScenario = s.scenarioId.split(':')[0];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Darstellung" icon={<Monitor size={16} />} />
        <CardBody className="space-y-4">
          <Field label="Farbschema">
            <Tabs
              value={ui.theme}
              onChange={ui.setTheme}
              items={[
                { id: 'light', label: <span className="flex items-center gap-1"><Sun size={13} /> Hell</span> },
                { id: 'dark', label: <span className="flex items-center gap-1"><Moon size={13} /> Dunkel</span> },
                { id: 'system', label: 'System' },
              ]}
            />
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Expertenmodus
              <span className="block text-xs text-muted-fg">Zeigt zusätzliche Kennzahlen (Rohwerte, Indizes, Zähler).</span>
            </span>
            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={ui.expert} onChange={(e) => ui.setExpert(e.target.checked)} />
          </label>
          {ui.expert && (
            <pre className="scroll-thin max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[11px]">
              {JSON.stringify({ seed: s.seed, rng: s.rng, market: s.market, phase: s.phase, unlocks: s.unlocks, counters: s.counters }, null, 1)}
            </pre>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Spiel" icon={<Gamepad2 size={16} />} subtitle={`${SCENARIO_BY_ID[baseScenario]?.title ?? 'Sandbox'} · Schwierigkeit: ${{ easy: 'leicht', normal: 'normal', hard: 'schwer' }[s.settings.difficulty]}`} />
        <CardBody className="space-y-4">
          <Field label="Name des Spielstands">
            <div className="flex gap-2">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name des Spielstands" />
              <Button variant="outline" onClick={() => dispatch({ type: 'renameSave', name })}>
                Umbenennen
              </Button>
            </div>
          </Field>
          <Field label={`Ereignishäufigkeit: ${Math.round(s.settings.eventFrequency * 100)} %`} hint="Beeinflusst Zufalls- und Marktereignisse. Zustandsbedingte Ereignisse (Frost, Vandalismus …) nur leicht.">
            <input type="range" min={0} max={2} step={0.25} value={s.settings.eventFrequency} onChange={(e) => dispatch({ type: 'setSetting', key: 'eventFrequency', value: Number(e.target.value) })} className="accent-[hsl(var(--primary))]" aria-label="Ereignishäufigkeit" />
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Automatisch pausieren bei Entscheidungen
              <span className="block text-xs text-muted-fg">Empfohlen. Sonst gilt nach Fristablauf die Standardoption.</span>
            </span>
            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={s.settings.autoPauseOnDecision} onChange={(e) => dispatch({ type: 'setSetting', key: 'autoPauseOnDecision', value: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Automatisches Mahnwesen
              <span className="block text-xs text-muted-fg">Nur mit Verwaltungssoftware oder Hausverwaltung wirksam.</span>
            </span>
            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={s.settings.autoDunning} onChange={(e) => dispatch({ type: 'setSetting', key: 'autoDunning', value: e.target.checked })} />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={() => dispatch({ type: 'setTutorialStep', step: 0 })}>
              Tutorial erneut zeigen
            </Button>
            <Button variant="outline" onClick={() => setRestart(true)}>
              <RotateCcw size={14} /> Neu starten
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await save('auto');
                closeGame();
              }}
            >
              <LogOut size={14} /> Hauptmenü
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Spielstände" icon={<HardDrive size={16} />} subtitle="Automatisches Speichern nach wichtigen Aktionen, jedem Monatsabschluss und alle 60 Sekunden" />
        <CardBody className="space-y-3">
          <p className="rounded-lg bg-warning/10 p-3 text-xs text-warning">
            Spielstände liegen in der IndexedDB dieses Browsers und sind an Browser und Adresse (Domain/Port) gebunden. Ein Docker-Neustart beeinflusst sie nicht – das Löschen der Browserdaten oder ein Wechsel der Adresse schon. Exportieren Sie wichtige Spielstände regelmäßig als JSON-Datei.
          </p>
          <SaveManager />
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Grafiken & Texturen" icon={<ImageIcon size={16} />} subtitle="Eigene Grafiken werden automatisch erkannt" />
        <CardBody>
          <GraphicsStatus />
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Optionale lokale KI" icon={<Bot size={16} />} subtitle="Formuliert Mieternachrichten sprachlich um. Das Spiel funktioniert vollständig ohne." />
        <CardBody className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={ui.aiEnabled} onChange={(e) => ui.setAi({ aiEnabled: e.target.checked })} /> Aktivieren
          </label>
          <Field label="Ollama-Adresse">
            <input className="input" value={ui.aiUrl} onChange={(e) => ui.setAi({ aiUrl: e.target.value })} aria-label="Ollama-Adresse" />
          </Field>
          <Field label="Modell">
            <input className="input" value={ui.aiModel} onChange={(e) => ui.setAi({ aiModel: e.target.value })} aria-label="Modell" />
          </Field>
          <Button
            variant="outline"
            onClick={async () => {
              setAiStatus('prüfe …');
              setAiStatus((await ollamaProvider(ui.aiUrl, ui.aiModel).available()) ? 'erreichbar' : 'nicht erreichbar');
            }}
          >
            Verbindung testen {aiStatus && <Badge tone={aiStatus === 'erreichbar' ? 'success' : 'neutral'}>{aiStatus}</Badge>}
          </Button>
          <p className="text-xs text-muted-fg md:col-span-4">Die KI erhält nur den Nachrichtentext und gibt nur Text zurück. Sie kann keine Geldbeträge, Verträge oder Spielzustände verändern; Texte mit veränderten Zahlen werden verworfen.</p>
        </CardBody>
      </Card>
      <Confirm
        open={restart}
        onOpenChange={setRestart}
        danger
        title="Spiel neu starten?"
        text="Das aktuelle Szenario beginnt von vorn mit einem neuen Spielstand. Der bisherige Spielstand bleibt in der Liste erhalten, bis Sie ihn ausdrücklich löschen."
        confirmLabel="Neu starten"
        onConfirm={() => newGame({ scenarioId: SCENARIO_BY_ID[baseScenario] ? baseScenario : 'endless_linden', difficulty: s.settings.difficulty })}
      />
    </div>
  );
}
