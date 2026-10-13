import { Briefcase, Lock, Users } from 'lucide-react';
import type { Services } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, EuroInput, Field, Progress, Select, Tip } from '@/components/ui';
import { useGame } from '@/store/gameStore';
import { STRATEGY_LABEL, autoSpentThisMonth, automationChannel } from '@/game/automation';
import type { Automation, Trade } from '@/domain/schema';
import { formatPercent } from '@/utils/money';
import { Bot } from 'lucide-react';
import { CONFIG } from '@/game/config';
import { TRADE_LABEL } from '@/content/components';
import { hasUnlock } from '@/game/progression';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { Stars } from '@/features/common';

interface Opt<K extends keyof Services> {
  value: Services[K];
  label: string;
  cost: number;
  effect: string;
  unlock?: string;
}

function ServiceCard<K extends keyof Services>({ k, title, description, options }: { k: K; title: string; description: string; options: Opt<K>[] }) {
  const s = useGs();
  const dispatch = useDispatch();
  return (
    <Card>
      <CardHeader title={title} subtitle={description} />
      <CardBody className="grid gap-2">
        {options.map((o) => {
          const active = s.services[k] === o.value;
          const locked = o.unlock && !hasUnlock(s, o.unlock);
          return (
            <Tip key={String(o.value)} content={locked ? 'Wird mit dem Spielfortschritt freigeschaltet (siehe Ziele & Phasen).' : undefined}>
              <button
                disabled={!!locked}
                onClick={() => dispatch({ type: 'setService', key: k, value: o.value })}
                aria-pressed={active}
                className={cn('flex items-start justify-between gap-3 rounded-lg border p-2.5 text-left transition', active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40', locked && 'cursor-not-allowed opacity-50')}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {locked && <Lock size={12} />}
                    {o.label}
                  </div>
                  <div className="text-xs text-muted-fg">{o.effect}</div>
                </div>
                <div className="num shrink-0 text-sm font-semibold">{o.cost ? `${formatMoney(o.cost, { decimals: false })}/M.` : 'kostenlos'}</div>
              </button>
            </Tip>
          );
        })}
      </CardBody>
    </Card>
  );
}

export function StaffPage() {
  const s = useGs();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const c = CONFIG.costs;
  const n = s.apartments.length;
  return (
    <div className="min-w-0 space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ServiceCard
          k="cleaning"
          title="Treppenhausreinigung"
          description="Umlagefähig. Beeinflusst Sauberkeit und Zufriedenheit."
          options={[
            { value: 'none', label: 'Keine Regelung', cost: 0, effect: 'Das Treppenhaus verschmutzt zusehends.' },
            { value: 'tenants', label: 'Kehrwoche durch Mieter', cost: 0, effect: 'Hängt von der Ordnungsliebe der Mieter ab.' },
            { value: 'biweekly', label: 'Reinigungsdienst 14-tägig', cost: c.cleaning.biweekly, effect: 'Solide Sauberkeit.' },
            { value: 'weekly', label: 'Reinigungsdienst wöchentlich', cost: c.cleaning.weekly, effect: 'Sehr sauber, gepflegter Eindruck.' },
          ]}
        />
        <ServiceCard
          k="garden"
          title="Gartenpflege"
          description="Umlagefähig. Hält Hof, Müllplatz und Grün in Ordnung."
          options={[
            { value: 'none', label: 'Keine', cost: 0, effect: 'Im Frühjahr und Sommer verwildert der Hof.' },
            { value: 'monthly', label: 'Monatlich', cost: c.garden.monthly, effect: 'Grundpflege.' },
            { value: 'biweekly', label: '14-tägig', cost: c.garden.biweekly, effect: 'Sehr gepflegter Außenbereich.' },
          ]}
        />
        <ServiceCard
          k="caretaker"
          title="Hausmeister"
          description="70 % umlagefähig. Erledigt Kleinreparaturen, entdeckt Mängel früh, bremst Verschleiß."
          options={[
            { value: 'none', label: 'Kein Hausmeister', cost: 0, effect: 'Sie kümmern sich selbst.' },
            { value: 'parttime', label: 'Teilzeit', cost: c.caretaker.parttime, effect: 'Kleinreparaturen, Rundgänge, Winterdienst.', unlock: 'caretaker' },
            { value: 'fulltime', label: 'Vollzeit', cost: c.caretaker.fulltime, effect: 'Doppelte Kapazität, tägliche Präsenz.', unlock: 'caretaker' },
          ]}
        />
        <ServiceCard
          k="management"
          title="Verwaltung"
          description="Nicht umlagefähig. Automatisiert das Mahnwesen und verbessert den Service."
          options={[
            { value: 'self', label: 'Selbstverwaltung', cost: 0, effect: 'Alles manuell.' },
            { value: 'software', label: 'Verwaltungssoftware', cost: c.management.software, effect: 'Automatische Zahlungserinnerungen und Mahnungen.', unlock: 'software' },
            { value: 'agency', label: 'Externe Hausverwaltung', cost: c.management.agency * n, effect: `${formatMoney(c.management.agency)} je Wohnung. Automatisches Mahnwesen, besserer Service.`, unlock: 'agency' },
          ]}
        />
        <ServiceCard
          k="insurance"
          title="Gebäudeversicherung"
          description="Umlagefähig. Deckt Sturm-, Leitungswasser- und Rohrbruchschäden."
          options={[
            { value: 'none', label: 'Keine', cost: 0, effect: 'Volles Risiko bei Großschäden.' },
            { value: 'basic', label: 'Basis', cost: c.insurance.basic, effect: `Selbstbeteiligung ${formatMoney(c.insuranceDeductible.basic, { decimals: false })}, Kürzung bei grober Vernachlässigung 50 %.` },
            { value: 'comfort', label: 'Komfort', cost: c.insurance.comfort, effect: `Selbstbeteiligung ${formatMoney(c.insuranceDeductible.comfort, { decimals: false })}, Kürzung max. 20 %.` },
          ]}
        />
        <Card>
          <CardHeader title="Weitere Verträge" />
          <CardBody className="grid gap-2">
            <Toggle k="maintenancePlan" label="Wartungsvertrag Haustechnik" cost={c.maintenancePlan} effect="Jährliche Wartung von Heizung, Elektrik, Leitungen, Sanitär und Dach – automatisch." unlock="maintenance_plan" />
            <Toggle k="winterService" label="Winterdienst" cost={c.winterService} effect="Räumen und Streuen bei Frost. Ohne Hausmeister sonst Ärger bei Glätte." />
            <Toggle k="tenantApp" label="Mieter-App" cost={c.tenantAppBase + c.tenantAppPerUnit * n} effect="Mieter melden Schäden per Foto, beauftragen Handwerker nach Ihren Regeln selbst und fühlen sich besser betreut." />
          </CardBody>
        </Card>
      </div>
      <AutomationCard />
      <Card>
        <CardHeader title="Handwerker & Dienstleister" icon={<Briefcase size={16} />} subtitle="Der günstigste Anbieter ist nicht immer die wirtschaftlich beste Wahl – Qualität und Zuverlässigkeit zählen" />
        <DataTable
          rows={s.contractors}
          rowKey={(x) => x.id}
          initialSort={{ key: 't', dir: 1 }}
          columns={[
            { key: 'n', header: 'Betrieb', cell: (x) => <div><div className="font-medium">{x.name}</div><div className="text-xs text-muted-fg">{x.description}</div></div>, sort: (x) => x.name },
            { key: 't', header: 'Gewerk', cell: (x) => <Badge>{TRADE_LABEL[x.trade]}</Badge>, sort: (x) => x.trade },
            { key: 'q', header: 'Qualität', cell: (x) => <Stars value={x.quality} />, sort: (x) => x.quality },
            { key: 'r', header: 'Zuverlässigkeit', align: 'right', cell: (x) => <span className={x.reliability >= 80 ? 'text-success' : x.reliability >= 65 ? 'text-warning' : 'text-danger'}>{x.reliability} %</span>, sort: (x) => x.reliability },
            { key: 'p', header: 'Preisniveau', align: 'right', cell: (x) => `${Math.round(x.priceFactor * 100)} %`, sort: (x) => x.priceFactor },
            { key: 'w', header: 'Vorlauf', align: 'right', cell: (x) => `${x.waitDays} T.`, sort: (x) => x.waitDays },
            { key: 'j', header: 'Aufträge', align: 'right', cell: (x) => x.jobsDone, sort: (x) => x.jobsDone },
            {
              key: 'f',
              header: <Tip content={`Rahmenvertrag: ${Math.round(c.frameworkDiscount * 100)} % Rabatt, kürzerer Vorlauf, Ihre Aufträge werden bevorzugt. ${formatMoney(c.frameworkContractFee)} pro Monat.`}><span>Rahmenvertrag</span></Tip>,
              align: 'right',
              cell: (x) => {
                const on = s.automation.frameworkContracts.includes(x.id);
                return (
                  <Button size="sm" variant={on ? 'primary' : 'outline'} disabled={busy} onClick={() => dispatch({ type: 'toggleFramework', contractorId: x.id })} aria-pressed={on}>
                    {on ? 'aktiv' : 'abschließen'}
                  </Button>
                );
              },
              sort: (x) => Number(s.automation.frameworkContracts.includes(x.id)),
            },
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Personal" icon={<Users size={16} />} />
        <CardBody className="text-sm text-muted-fg">
          {s.services.caretaker === 'none' ? 'Sie beschäftigen derzeit kein eigenes Personal.' : `Hausmeister (${s.services.caretaker === 'fulltime' ? 'Vollzeit' : 'Teilzeit'}) – bisher ${s.counters.caretakerFixes ?? 0} Kleinreparaturen erledigt.`}
        </CardBody>
      </Card>
    </div>
  );
}

function Toggle({ k, label, cost, effect, unlock }: { k: 'maintenancePlan' | 'winterService' | 'tenantApp'; label: string; cost: number; effect: string; unlock?: string }) {
  const s = useGs();
  const dispatch = useDispatch();
  const on = s.services[k];
  const locked = unlock && !hasUnlock(s, unlock);
  return (
    <button disabled={!!locked} onClick={() => dispatch({ type: 'setService', key: k, value: !on })} aria-pressed={on} className={cn('flex items-start justify-between gap-3 rounded-lg border p-2.5 text-left', on ? 'border-primary bg-primary/5' : 'border-border', locked && 'cursor-not-allowed opacity-50')}>
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {locked && <Lock size={12} />}
          {label} {on && <Badge tone="success">aktiv</Badge>}
        </div>
        <div className="text-xs text-muted-fg">{effect}</div>
      </div>
      <div className="num shrink-0 text-sm font-semibold">{formatMoney(cost, { decimals: false })}/M.</div>
    </button>
  );
}

function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-fg">{hint}</span>}
      </span>
    </label>
  );
}

/** Regeln für die automatische Auftragsvergabe (Mieter-App / Hausverwaltung) und Vermietung. */
function AutomationCard() {
  const s = useGs();
  const dispatch = useDispatch();
  const a = s.automation;
  const set = (patch: Partial<Automation>) => dispatch({ type: 'setAutomation', patch });
  const channel = automationChannel(s);
  const spent = autoSpentThisMonth(s);
  const trades = Array.from(new Set(s.contractors.map((x) => x.trade))) as Trade[];
  return (
    <Card>
      <CardHeader
        title="Automatik: Reparaturen & Vermietung"
        icon={<Bot size={16} />}
        subtitle="Gilt für alle Objekte. Aufträge werden nur vergeben, wenn im jeweiligen Haus die Mieter-App oder eine externe Hausverwaltung aktiv ist."
        actions={channel ? <Badge tone="success">{channel === 'app' ? 'Mieter-App aktiv' : 'Hausverwaltung aktiv'}</Badge> : <Badge tone="warning">in diesem Haus inaktiv</Badge>}
      />
      <CardBody className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-2">
          <Check label="Schäden automatisch beauftragen" hint="Gemeldete Schäden werden sofort an einen passenden Betrieb vergeben." checked={a.autoRepair} onChange={(v) => set({ autoRepair: v })} />
          <Check label="Kritische Schäden immer beauftragen" hint="Rohrbruch, Heizungsausfall & Co. auch über Grenze und Budget hinaus." checked={a.includeCritical} onChange={(v) => set({ includeCritical: v })} />
          <Check label="Vorbeugende Wartung" hint="Bauteile unter 50 % Zustand werden gewartet (wöchentliche Prüfung)." checked={a.autoMaintenance} onChange={(v) => set({ autoMaintenance: v })} />
          <Check label="Leere Wohnungen renovieren" hint="Renovierungsbedürftige Wohnungen werden gestrichen, damit sie vermietbar werden." checked={a.autoRenovateVacant} onChange={(v) => set({ autoRenovateVacant: v })} />
        </div>
        <div className="space-y-3">
          <Field label="Strategie bei der Anbieterwahl">
            <Select value={a.strategy} onChange={(v) => set({ strategy: v as Automation['strategy'] })} options={Object.entries(STRATEGY_LABEL).map(([value, label]) => ({ value, label }))} aria-label="Strategie" />
          </Field>
          <Field label="Höchstbetrag je Auftrag" hint="Teurere Aufträge warten auf Ihre Freigabe.">
            <EuroInput value={a.maxAutoCost} onChange={(v) => set({ maxAutoCost: Math.max(0, v) })} min={0} step={50} aria-label="Höchstbetrag je Auftrag" />
          </Field>
          <Field label="Monatsbudget (alle Objekte)" hint={`Diesen Monat vergeben: ${formatMoney(spent, { decimals: false })}`}>
            <EuroInput value={a.monthlyBudget} onChange={(v) => set({ monthlyBudget: Math.max(0, v) })} min={0} step={100} aria-label="Monatsbudget" />
          </Field>
          <Progress value={Math.min(100, (spent / Math.max(1, a.monthlyBudget)) * 100)} tone={spent > a.monthlyBudget * 0.9 ? 'warning' : 'primary'} />
          <Field label="Mindestreserve auf dem Konto">
            <EuroInput value={a.minCashReserve} onChange={(v) => set({ minCashReserve: Math.max(0, v) })} min={0} step={500} aria-label="Mindestreserve" />
          </Field>
        </div>
        <div className="space-y-3">
          <Check label="Vermietungsservice" hint={s.services.management === 'agency' ? 'Inklusive bei externer Hausverwaltung.' : `Inseriert leere Wohnungen und wählt Mieter aus. Provision ${CONFIG.automation.lettingFeeRents} Kaltmieten je Vertrag.`} checked={a.autoLetting} onChange={(v) => set({ autoLetting: v })} />
          <Field label="Angebotsmiete (relativ zur Vergleichsmiete)">
            <Select value={String(a.lettingRentFactor)} onChange={(v) => set({ lettingRentFactor: Number(v) })} options={[0.9, 0.95, 0.97, 1, 1.05, 1.1].map((f) => ({ value: String(f), label: formatPercent(f) }))} aria-label="Angebotsmiete" />
          </Field>
          <Field label="Mindest-Passung der Bewerber">
            <Select value={String(a.minApplicantFit)} onChange={(v) => set({ minApplicantFit: Number(v) })} options={[0.4, 0.5, 0.6, 0.7, 0.8].map((f) => ({ value: String(f), label: formatPercent(f) }))} aria-label="Mindest-Passung" />
          </Field>
          <details className="rounded-lg border border-border p-2.5 text-sm">
            <summary className="cursor-pointer font-medium">Bevorzugte Betriebe je Gewerk</summary>
            <div className="mt-2 grid gap-2">
              {trades.map((t) => (
                <Field key={t} label={TRADE_LABEL[t]}>
                  <Select
                    value={a.preferred[t] ?? ''}
                    onChange={(v) => {
                      const preferred = { ...a.preferred };
                      if (v) preferred[t] = v;
                      else delete preferred[t];
                      set({ preferred });
                    }}
                    options={[{ value: '', label: 'nach Strategie' }, ...s.contractors.filter((x) => x.trade === t).map((x) => ({ value: x.id, label: x.name }))]}
                    aria-label={`Bevorzugt ${TRADE_LABEL[t]}`}
                  />
                </Field>
              ))}
            </div>
          </details>
        </div>
      </CardBody>
    </Card>
  );
}
