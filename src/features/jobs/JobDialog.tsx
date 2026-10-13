import * as React from 'react';
import { AlertTriangle, CheckCircle2, Clock, HardHat, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge, Button, Modal, Tip } from '@/components/ui';
import { useGame } from '@/store/gameStore';
import { offersFor, specFor, type JobRequest } from '@/game/jobs';
import { forecastMeasure } from '@/game/forecast';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { Money, Stars, URGENCY_LABEL, URGENCY_TONE } from '../common';

/**
 * Angebotsvergleich und Kosten-/Nutzenprognose vor der Beauftragung.
 */
export function JobDialog({ request, open, onOpenChange }: { request: JobRequest | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useGame((x) => x.game)!;
  const dispatch = useGame((x) => x.dispatch);
  const busy = useGame((x) => x.busy);
  const [chosen, setChosen] = React.useState<string | null>(null);
  const spec = React.useMemo(() => (request ? specFor(s, request) : null), [s, request]);
  const offers = React.useMemo(() => (spec && !('error' in spec) ? offersFor(s, spec) : []), [s, spec]);
  React.useEffect(() => {
    if (open) {
      const best = [...offers].sort((a, b) => b.quality * 2 + b.reliability / 20 - a.price / 50000 - (a.quality * 2 + a.reliability / 20 - b.price / 50000))[0];
      setChosen(best?.contractorId ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);
  const forecast = React.useMemo(() => (request && chosen ? forecastMeasure(s, request, chosen) : null), [s, request, chosen]);
  if (!request || !spec) return null;
  if ('error' in spec)
    return (
      <Modal open={open} onOpenChange={onOpenChange} title="Auftrag nicht möglich">
        <p className="text-sm">{spec.error}</p>
      </Modal>
    );
  const offer = offers.find((o) => o.contractorId === chosen);
  const f = forecast && !('error' in forecast) ? forecast : null;
  const isMeasure = !!spec.measure;
  const showForecast = f && (isMeasure || request.kind === 'maintenance');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      xwide
      title={spec.title}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={URGENCY_TONE[spec.urgency]}>{URGENCY_LABEL[spec.urgency]}</Badge>
          <span>{spec.cause}</span>
        </span>
      }
      footer={
        <>
          <div className="mr-auto text-xs text-muted-fg">
            Kontostand: <Money cents={s.cash} /> · Dispo: <Money cents={s.overdraftLimit} decimals={false} />
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={!chosen || busy}
            onClick={() => {
              if (!chosen) return;
              const r = dispatch({ type: 'createJob', request, contractorId: chosen });
              if (r.ok) onOpenChange(false);
            }}
          >
            <HardHat size={15} /> Beauftragen {offer && `(${formatMoney(offer.price, { decimals: false })})`}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <p className="text-sm text-muted-fg">{spec.description}</p>
          <div>
            <div className="label mb-2">Angebote vergleichen</div>
            {offers.length === 0 && <div className="rounded-lg bg-muted p-3 text-sm">Kein passender Dienstleister verfügbar.</div>}
            <div className="space-y-2">
              {offers.map((o) => {
                const c = s.contractors.find((x) => x.id === o.contractorId)!;
                const active = chosen === o.contractorId;
                const cheapest = o.price === Math.min(...offers.map((x) => x.price));
                return (
                  <button
                    key={o.contractorId}
                    onClick={() => setChosen(o.contractorId)}
                    className={cn('w-full rounded-xl border p-3 text-left transition', active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40')}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {o.contractorName}
                          {cheapest && offers.length > 1 && <Badge tone="success">Günstigstes</Badge>}
                          {c.jobsDone > 2 && <Badge tone="primary">Bewährt ({c.jobsDone})</Badge>}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-fg">{c.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="num text-base font-bold">{formatMoney(o.price, { decimals: false })}</div>
                        <div className="text-[11px] text-muted-fg">±{Math.round(o.uncertainty * 100)} % Schätzunsicherheit</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="flex items-center gap-1">
                        Qualität <Stars value={o.quality} />
                      </span>
                      <Tip content="Wahrscheinlichkeit, dass Termine eingehalten werden. Unzuverlässige Betriebe sagen öfter ab oder verzögern.">
                        <span className={cn('font-medium', o.reliability >= 80 ? 'text-success' : o.reliability >= 65 ? 'text-warning' : 'text-danger')}>Zuverlässigkeit {o.reliability} %</span>
                      </Tip>
                      <span className="flex items-center gap-1 text-muted-fg">
                        <Clock size={12} /> Start {o.startDay <= s.day ? 'sofort' : formatDate(o.startDay)} · {o.days} Tag(e)
                      </span>
                      {o.firstPayment > 0 && <span className="text-muted-fg">Abschlag bei Start: {formatMoney(o.firstPayment, { decimals: false })}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="label mb-1">Erwartete Wirkung</div>
              <ul className="space-y-1 text-sm">
                {spec.effects.map((e) => (
                  <li key={e} className="flex gap-1.5">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label mb-1">Material & Gewerk</div>
              <p className="text-sm text-muted-fg">{spec.materials.join(', ')}</p>
              {spec.noise > 0 && <p className="mt-1 text-xs text-warning">Lärmbelastung: {['', 'gering', 'mittel', 'hoch'][spec.noise]}</p>}
              {spec.blocksApartment && <p className="mt-1 text-xs text-warning">Wohnung während der Arbeiten nicht nutzbar.</p>}
            </div>
          </div>
        </div>
        <div className="space-y-3 rounded-xl bg-muted/50 p-4">
          <div className="label">Kosten- & Nutzenprognose</div>
          {f ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Minimum" value={formatMoney(f.costMin, { decimals: false })} />
                <MiniStat label="Erwartet" value={formatMoney(f.costEstimate, { decimals: false })} strong />
                <MiniStat label="Maximum" value={formatMoney(f.costMax, { decimals: false })} />
              </div>
              {f.subsidy > 0 && <div className="rounded-lg bg-success/10 p-2 text-xs text-success">Förderzuschuss: {formatMoney(f.subsidy)}</div>}
              <div className={cn('rounded-lg p-2 text-xs', f.liquidityAfter < 0 ? 'bg-danger/10 text-danger' : 'bg-card')}>
                Kontostand danach (erwartet): <strong>{formatMoney(f.liquidityAfter, { decimals: false })}</strong>
                {f.liquidityAfter < -s.overdraftLimit && ' – über dem Dispositionsrahmen!'}
              </div>
              {showForecast && (
                <div className="space-y-1.5 text-sm">
                  <Delta label="Vergleichsmiete (Haus, mtl.)" before={f.before.comparableRent} after={f.after.comparableRent} money />
                  <Delta label="Energiekosten pro Jahr" before={f.before.annualEnergyCost} after={f.after.annualEnergyCost} money invert />
                  <Delta label="Endenergie kWh/m²a" before={f.before.energyDemand} after={f.after.energyDemand} invert fmt={(v) => Math.round(v).toString()} />
                  <Row label="Effizienzklasse" value={`${f.before.energyClass} → ${f.after.energyClass}`} />
                  <Delta label="Marktwert" before={f.before.marketValue} after={f.after.marketValue} money />
                  <Delta label="Gebäudezustand" before={f.before.buildingCondition} after={f.after.buildingCondition} fmt={(v) => `${Math.round(v)} %`} />
                  <Delta label="Ø Zufriedenheit (Ziel)" before={f.before.satisfactionTarget} after={f.after.satisfactionTarget} fmt={(v) => `${Math.round(v)} %`} />
                  {f.modernizationSurchargeMonthly > 0 && <Row label="Mögliche Modernisierungsumlage" value={`bis ${formatMoney(f.modernizationSurchargeMonthly)}/Monat`} />}
                  <Row label="Amortisation (grob)" value={f.paybackYears !== null ? `${f.paybackYears.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Jahre` : '–'} />
                </div>
              )}
              <ul className="space-y-1 border-t border-border pt-2 text-xs text-muted-fg">
                {f.notes.map((n) => (
                  <li key={n} className="flex gap-1.5">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-fg">Bitte ein Angebot wählen.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

const MiniStat = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="rounded-lg bg-card p-2">
    <div className="text-[10px] uppercase text-muted-fg">{label}</div>
    <div className={cn('num text-sm', strong && 'font-bold')}>{value}</div>
  </div>
);
const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-fg">{label}</span>
    <span className="num font-medium">{value}</span>
  </div>
);
function Delta({ label, before, after, money, invert, fmt }: { label: string; before: number; after: number; money?: boolean; invert?: boolean; fmt?: (v: number) => string }) {
  const f = fmt ?? ((v: number) => (money ? formatMoney(v, { decimals: false }) : String(Math.round(v))));
  const d = after - before;
  const good = invert ? d < 0 : d > 0;
  const same = Math.abs(d) < (money ? 100 : 0.5);
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-fg">{label}</span>
      <span className="num flex items-center gap-1 font-medium">
        {f(before)} → {f(after)}
        {!same && (good ? <TrendingUp size={13} className="text-success" /> : <TrendingDown size={13} className="text-danger" />)}
      </span>
    </div>
  );
}
