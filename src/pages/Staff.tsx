import { Briefcase, Lock, Users } from 'lucide-react';
import type { Services } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { Badge, Card, CardBody, CardHeader, DataTable, Tip } from '@/components/ui';
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
          </CardBody>
        </Card>
      </div>
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

function Toggle({ k, label, cost, effect, unlock }: { k: 'maintenancePlan' | 'winterService'; label: string; cost: number; effect: string; unlock?: string }) {
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
