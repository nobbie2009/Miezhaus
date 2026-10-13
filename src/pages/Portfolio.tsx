import * as React from 'react';
import { Building2, ClipboardCheck, Coins, Landmark, Lock, PiggyBank, Search, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Investment, PropertyOffer } from '@/domain/schema';
import { useDispatch, useRoot } from '@/hooks/useGameState';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, Confirm, DataTable, Empty, EuroInput, Field, KeyValue, Modal, Progress, Select, Stat, Tabs, conditionTone } from '@/components/ui';
import { CONFIG } from '@/game/config';
import { backlogCost, buildingCondition, energyClass, equity, investmentsValue, loanBalance, marketValue, portfolioValue, totalArea } from '@/game/derived';
import { loanQuote } from '@/game/finance';
import { INVESTMENT_LABEL, fixedRate, savingsRate } from '@/game/investments';
import { propertyView } from '@/game/portfolio';
import { hasUnlock } from '@/game/progression';
import { bidAcceptance, propertySummaries, purchaseCosts, saleQuote, surveyCost } from '@/game/realestate';
import { formatDate, formatPeriod, monthKey } from '@/utils/date';
import { euro, formatMoney, formatPercent } from '@/utils/money';

type Tab = 'owned' | 'market' | 'invest';

export function PortfolioPage() {
  const s = useRoot();
  const focus = useUi((x) => x.focusId);
  const [tab, setTab] = React.useState<Tab>(focus?.startsWith('offer') ? 'market' : 'owned');
  const props = propertySummaries(s);
  return (
    <div className="min-w-0 space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Immobilienvermögen" value={formatMoney(portfolioValue(s), { decimals: false })} sub={`${props.length} Objekt${props.length > 1 ? 'e' : ''}, ${props.reduce((a, p) => a + p.units, 0)} Wohnungen`} icon={<Building2 size={16} />} />
        <Stat label="Geldanlagen" value={formatMoney(investmentsValue(s), { decimals: false })} icon={<PiggyBank size={16} />} hint="Tagesgeld, Festgeld und ETF-Depot zum aktuellen Wert." />
        <Stat label="Kredite" value={formatMoney(loanBalance(s), { decimals: false })} icon={<Landmark size={16} />} sub={`Beleihung ${formatPercent(loanBalance(s) / Math.max(1, portfolioValue(s)))}`} />
        <Stat label="Eigenkapital gesamt" value={formatMoney(equity(s), { decimals: false })} tone={equity(s) < 0 ? 'danger' : 'success'} icon={<Coins size={16} />} hint="Immobilien + Konto + Anlagen − Kredite − Verbindlichkeiten." />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'owned', label: 'Meine Objekte' },
          { id: 'market', label: 'Immobilienmarkt', badge: s.propertyMarket.length ? <Badge tone="primary">{s.propertyMarket.length}</Badge> : undefined },
          { id: 'invest', label: 'Geldanlagen' },
        ]}
      />
      {tab === 'owned' && <Owned />}
      {tab === 'market' && <Market />}
      {tab === 'invest' && <Investments />}
    </div>
  );
}

function Owned() {
  const s = useRoot();
  const { setProperty, navigate } = useUi();
  const dispatch = useDispatch();
  const [sell, setSell] = React.useState<string | null>(null);
  const rows = propertySummaries(s);
  const q = sell ? saleQuote(s, sell) : null;
  return (
    <Card>
      <CardHeader title="Portfolio" subtitle="Wechseln Sie oben in der Objektauswahl zwischen Ihren Häusern. Konto, Kredite, Handwerker und Nachrichten sind gemeinsam." icon={<Building2 size={16} />} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: 'n', header: 'Objekt', cell: (r) => <div><div className="font-medium">{r.name} {r.isMain && <Badge>Stammhaus</Badge>}</div><div className="text-xs text-muted-fg">{r.city}</div></div>, sort: (r) => r.name },
          { key: 'u', header: 'Vermietet', align: 'right', cell: (r) => `${r.rented}/${r.units}`, sort: (r) => r.rented / Math.max(1, r.units) },
          { key: 'c', header: 'Zustand', cell: (r) => <Progress value={r.condition} tone={conditionTone(r.condition)} label={`${Math.round(r.condition)} %`} />, sort: (r) => r.condition },
          { key: 'r', header: 'Sollmiete/M.', align: 'right', cell: (r) => formatMoney(r.rent, { decimals: false }), sort: (r) => r.rent },
          { key: 'v', header: 'Marktwert', align: 'right', cell: (r) => formatMoney(r.value, { decimals: false }), sort: (r) => r.value },
          { key: 'y', header: 'Bruttorendite', align: 'right', cell: (r) => formatPercent(r.grossYield, 1), sort: (r) => r.grossYield },
          {
            key: 'a',
            header: '',
            align: 'right',
            cell: (r) => (
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="outline" onClick={() => { setProperty(r.isMain ? null : r.id); navigate('overview'); }}>Verwalten</Button>
                {!r.isMain && <Button size="sm" variant="ghost" onClick={() => setSell(r.id)}>Verkaufen</Button>}
              </div>
            ),
          },
        ]}
      />
      {q && (
        <Confirm
          open={!!sell}
          onOpenChange={(v) => !v && setSell(null)}
          title="Objekt verkaufen?"
          confirmLabel={`Für ${formatMoney(q.price, { decimals: false })} verkaufen`}
          danger
          text={
            <div className="space-y-2 text-sm">
              <KeyValue
                items={[
                  ['Verkaufspreis (Marktwert)', formatMoney(q.price)],
                  ['Notar, Vermarktung', `− ${formatMoney(q.costs)}`],
                  ['Gewinn ggü. Kaufpreis', formatMoney(q.gain)],
                  ['Steuer', q.speculation ? (q.tax ? `− ${formatMoney(q.tax)}` : '0 €') : 'steuerfrei (> 10 Jahre)'],
                  ['Netto-Erlös', <strong key="n">{formatMoney(q.net)}</strong>],
                ]}
              />
              {q.speculation && <p className="text-xs text-warning">Verkauf innerhalb der 10-jährigen Spekulationsfrist: Der Gewinn ist steuerpflichtig.</p>}
              <p className="text-xs text-muted-fg">Mieter und Verträge gehen auf den Käufer über. Geplante Aufträge werden storniert.</p>
            </div>
          }
          onConfirm={() => {
            if (sell) {
              dispatch({ type: 'sellProperty', buildingId: sell });
              setProperty(null);
            }
            setSell(null);
          }}
        />
      )}
    </Card>
  );
}

function Market() {
  const s = useRoot();
  const [buy, setBuy] = React.useState<PropertyOffer | null>(null);
  if (!hasUnlock(s, 'portfolio'))
    return <Empty icon={<Lock size={28} />} title="Immobilienmarkt noch gesperrt" text="Erreichen Sie Phase 3 (Optimierung): mind. 80 % vermietet, Ø Zufriedenheit ≥ 58 % und zwei Monate positiver Cashflow. Dann melden sich Makler mit Angeboten." />;
  if (!s.propertyMarket.length) return <Empty icon={<Search size={28} />} title="Derzeit keine Angebote" text={`Neue Angebote erscheinen alle paar Wochen${s.counters.nextOfferDay ? ` – voraussichtlich ab ${formatDate(s.counters.nextOfferDay)}` : ''}.`} />;
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {s.propertyMarket.map((o) => (
        <OfferCard key={o.id} o={o} onBuy={() => setBuy(o)} />
      ))}
      {buy && <BuyDialog o={buy} onClose={() => setBuy(null)} />}
    </div>
  );
}

function OfferCard({ o, onBuy }: { o: PropertyOffer; onBuy: () => void }) {
  const s = useRoot();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const v = propertyView(s, o.property);
  const area = totalArea(v);
  const rent = o.property.contracts.filter((c) => c.status !== 'ended').reduce((a, c) => a + c.netRent, 0);
  const rented = o.property.apartments.filter((a) => a.status === 'rented').length;
  const value = marketValue(v);
  const cond = buildingCondition(v);
  const costs = purchaseCosts(o);
  const knownDefects = o.property.defects.filter((d) => d.discovered && d.resolvedDay === null).length;
  return (
    <Card>
      <CardHeader
        title={o.property.building.name}
        subtitle={`${o.property.building.city} · ${o.property.building.buildingClass}`}
        icon={<Building2 size={16} />}
        actions={<Badge tone={o.expiresDay - s.day < 14 ? 'warning' : 'neutral'}>bis {formatDate(o.expiresDay)}</Badge>}
      />
      <CardBody className="space-y-3">
        <p className="text-sm italic text-muted-fg">„{o.pitch}“ – {o.seller}</p>
        <KeyValue
          items={[
            ['Kaufpreis', <strong key="p">{formatMoney(o.askingPrice, { decimals: false })}</strong>],
            ['Preis je m²', formatMoney(Math.round(o.askingPrice / Math.max(1, area)), { decimals: false })],
            ['Wohnungen / Fläche', `${o.property.apartments.length} / ${Math.round(area)} m²`],
            ['Baujahr', o.property.building.yearBuilt],
            ['Vermietet', `${rented} von ${o.property.apartments.length}`],
            ['Ist-Miete kalt', `${formatMoney(rent, { decimals: false })}/M.`],
            ['Bruttorendite', formatPercent((rent * 12) / o.askingPrice, 1)],
            ['Kaufpreisfaktor', `${(o.askingPrice / Math.max(1, rent * 12)).toFixed(1)}-fach`],
            ['Lage', o.property.building.locationFactor >= 1.15 ? 'sehr gut' : o.property.building.locationFactor >= 1 ? 'gut' : o.property.building.locationFactor >= 0.9 ? 'mittel' : 'einfach'],
            ['Energieklasse', energyClass(v).label],
            ['Zustand laut Exposé', `${o.advertisedCondition} %`],
            ['Zustand laut Gutachten', o.surveyed ? <span key="c" className={cond < o.advertisedCondition - 5 ? 'text-danger' : ''}>{Math.round(cond)} %</span> : '– (kein Gutachten)'],
            ['Instandhaltungsstau', o.surveyed ? formatMoney(backlogCost(v), { decimals: false }) : 'unbekannt'],
            ['Bekannte Mängel', knownDefects],
            ['Kaufnebenkosten', formatMoney(costs.total - costs.price, { decimals: false })],
            ['Unser Wertgutachten', o.surveyed ? formatMoney(value, { decimals: false }) : 'erst mit Gutachten'],
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || o.surveyed} onClick={() => dispatch({ type: 'surveyOffer', offerId: o.id })}>
            <ClipboardCheck size={14} /> {o.surveyed ? 'Gutachten liegt vor' : `Gutachten (${formatMoney(surveyCost(o), { decimals: false })})`}
          </Button>
          <Button disabled={busy} onClick={onBuy}>
            Kaufen / Gebot abgeben
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function BuyDialog({ o, onClose }: { o: PropertyOffer; onClose: () => void }) {
  const s = useRoot();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const [price, setPrice] = React.useState(o.askingPrice);
  const [loan, setLoan] = React.useState(Math.round((o.askingPrice * 0.7) / 100000) * 100000);
  const [years, setYears] = React.useState(25);
  const costs = purchaseCosts(o, price);
  const equityNeeded = costs.total - loan;
  // Grobe Bankprüfung: Beleihung inkl. neuem Objekt
  const q = loanQuote(s, loan, years);
  const maxLoan = Math.max(0, Math.floor(((portfolioValue(s) + marketValue(propertyView(s, o.property))) * CONFIG.finance.maxLoanToValue - loanBalance(s)) / 100000) * 100000);
  const accept = bidAcceptance(o, price);
  const rent = o.property.contracts.filter((c) => c.status !== 'ended').reduce((a, c) => a + c.netRent, 0);
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Kauf: ${o.property.building.name}`}
      description="Kaufpreis, Finanzierung und Nebenkosten. Grunderwerbsteuer, Notar und ggf. Makler müssen aus Eigenkapital bezahlt werden."
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button
            disabled={busy || equityNeeded > s.cash || loan > Math.min(price, maxLoan)}
            onClick={() => {
              const r = dispatch({ type: 'buyProperty', offerId: o.id, price, loanAmount: loan, loanYears: years });
              if (r.ok) onClose();
            }}
          >
            {price < o.askingPrice ? 'Gebot abgeben' : 'Kaufvertrag beurkunden'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Ihr Gebot" hint={price < o.askingPrice ? `Chance auf Annahme ca. ${formatPercent(accept)} – ein abgelehntes Gebot beendet die Verhandlung.` : 'Angebotspreis – der Verkäufer nimmt sicher an.'}>
            <EuroInput value={price} onChange={setPrice} min={Math.round(o.askingPrice * 0.75)} max={o.askingPrice} step={1000} aria-label="Gebot" />
          </Field>
          <Field label="Hypothek" hint={`Höchstens ${formatMoney(Math.min(price, maxLoan), { decimals: false })} (Beleihungsgrenze ${Math.round(CONFIG.finance.maxLoanToValue * 100)} % aller Objekte, max. Kaufpreis).`}>
            <EuroInput value={loan} onChange={setLoan} min={0} max={Math.min(price, maxLoan)} step={1000} aria-label="Hypothek" />
          </Field>
          <Field label={`Laufzeit: ${years} Jahre`}>
            <Select value={String(years)} onChange={(v) => setYears(Number(v))} options={[10, 15, 20, 25, 30].map((y) => ({ value: String(y), label: `${y} Jahre` }))} aria-label="Laufzeit" />
          </Field>
        </div>
        <div className="space-y-2 text-sm">
          <KeyValue
            items={[
              ['Kaufpreis', formatMoney(costs.price)],
              [`Grunderwerbsteuer (${formatPercent(CONFIG.realEstate.transferTax, 1)})`, formatMoney(costs.transferTax)],
              [`Notar & Grundbuch (${formatPercent(CONFIG.realEstate.notary, 1)})`, formatMoney(costs.notary)],
              ['Maklerprovision', costs.broker ? formatMoney(costs.broker) : 'entfällt'],
              ['Gesamtkosten', <strong key="t">{formatMoney(costs.total)}</strong>],
              ['− Hypothek', formatMoney(loan)],
              ['Benötigtes Eigenkapital', <strong key="e" className={equityNeeded > s.cash ? 'text-danger' : ''}>{formatMoney(equityNeeded)}</strong>],
              ['Ihr Kontostand', formatMoney(s.cash)],
              ['Zins (Angebot)', loan ? formatPercent(q.annualRate, 2) : '–'],
              ['Monatsrate', loan ? formatMoney(q.monthlyPayment) : '–'],
              ['Ist-Miete kalt', `${formatMoney(rent)}/M.`],
            ]}
          />
          {loan > 0 && q.monthlyPayment > rent * 0.85 && <p className="text-xs text-warning">Die Rate frisst fast die gesamte Kaltmiete – Bewirtschaftungskosten und Rücklagen sind dann nicht gedeckt.</p>}
          {!o.surveyed && <p className="text-xs text-warning">Ohne Gutachten kaufen Sie die Katze im Sack: Verkäufer übertreiben den Zustand gern.</p>}
        </div>
      </div>
    </Modal>
  );
}

function Investments() {
  const s = useRoot();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const [kind, setKind] = React.useState<Investment['kind']>('savings');
  const [amount, setAmount] = React.useState(euro(10_000));
  const [years, setYears] = React.useState(2);
  const [out, setOut] = React.useState<{ id: string; amount: number } | null>(null);
  const yearKey = `allowanceUsed-${new Date(s.day * 86400000).getUTCFullYear()}`;
  const history = React.useMemo(() => {
    const byDay = new Map<number, number>();
    for (const i of s.investments) for (const h of i.history) byDay.set(h.day, (byDay.get(h.day) ?? 0) + h.value);
    return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, value]) => ({ p: formatPeriod(monthKey(day)), v: value / 100 }));
  }, [s.investments]);
  const rateInfo = kind === 'savings' ? `${formatPercent(savingsRate(s), 2)} p. a., täglich verfügbar, Zins variabel` : kind === 'fixed' ? `${formatPercent(fixedRate(s, years), 2)} p. a. fest, gebunden bis Laufzeitende` : 'Ø ca. 6–7 % p. a., aber deutliche Schwankungen (auch −20 % sind möglich)';
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <Card>
        <CardHeader title="Geld anlegen" subtitle="Überschüsse arbeiten lassen – aber Liquidität für Reparaturen behalten." icon={<TrendingUp size={16} />} />
        <CardBody className="space-y-3">
          <Field label="Anlageform">
            <Select value={kind} onChange={(v) => setKind(v as Investment['kind'])} options={(['savings', 'fixed', 'etf'] as const).map((k) => ({ value: k, label: INVESTMENT_LABEL[k] }))} aria-label="Anlageform" />
          </Field>
          {kind === 'fixed' && (
            <Field label="Laufzeit">
              <Select value={String(years)} onChange={(v) => setYears(Number(v))} options={[1, 2, 3, 5].map((y) => ({ value: String(y), label: `${y} Jahr${y > 1 ? 'e' : ''} – ${formatPercent(fixedRate(s, y), 2)}` }))} aria-label="Laufzeit" />
            </Field>
          )}
          <Field label="Betrag" hint={rateInfo}>
            <EuroInput value={amount} onChange={setAmount} min={10000} max={Math.max(10000, s.cash)} step={100} aria-label="Anlagebetrag" />
          </Field>
          <Button disabled={busy || amount > s.cash} onClick={() => dispatch({ type: 'invest', kind, amount, years })}>
            Anlegen
          </Button>
          <p className="text-xs text-muted-fg">
            Erträge unterliegen der Abgeltungsteuer ({formatPercent(CONFIG.investments.capitalGainsTax, 2)} inkl. Soli). Sparer-Pauschbetrag {formatMoney(CONFIG.investments.allowance, { decimals: false })}/Jahr – genutzt: {formatMoney(s.counters[yearKey] ?? 0, { decimals: false })}. ETF-Gewinne sind zu 30 % steuerfrei (Teilfreistellung).
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Depot & Konten" icon={<PiggyBank size={16} />} />
        {s.investments.length === 0 ? (
          <CardBody>
            <Empty icon={<PiggyBank size={26} />} title="Noch keine Geldanlagen" text="Tagesgeld ist eine sichere Parkposition für Rücklagen, Festgeld bringt etwas mehr, ETFs langfristig am meisten – mit Risiko." />
          </CardBody>
        ) : (
          <>
            <DataTable
              rows={s.investments}
              rowKey={(i) => i.id}
              columns={[
                { key: 'n', header: 'Anlage', cell: (i) => <div><div className="font-medium">{i.name}</div><div className="text-xs text-muted-fg">{i.kind === 'etf' ? 'Aktien weltweit' : `${formatPercent(i.annualRate, 2)} p. a.`}{i.maturityDay ? ` · fällig ${formatDate(i.maturityDay)}` : ''}</div></div> },
                { key: 'p', header: 'Eingezahlt', align: 'right', cell: (i) => formatMoney(i.principal, { decimals: false }) },
                { key: 'v', header: 'Wert', align: 'right', cell: (i) => formatMoney(i.value, { decimals: false }) },
                { key: 'g', header: 'Ertrag', align: 'right', cell: (i) => <span className={i.value + i.accrued - i.principal >= 0 ? 'text-success' : 'text-danger'}>{formatMoney(Math.round(i.value + i.accrued - i.principal), { decimals: false })}</span> },
                {
                  key: 'a',
                  header: '',
                  align: 'right',
                  cell: (i) =>
                    i.kind === 'fixed' ? (
                      <Badge>gebunden</Badge>
                    ) : out?.id === i.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-28"><EuroInput value={out.amount} onChange={(v) => setOut({ id: i.id, amount: v })} max={i.value} aria-label="Auszahlungsbetrag" /></div>
                        <Button size="sm" disabled={busy} onClick={() => { const r = dispatch({ type: 'withdrawInvestment', investmentId: i.id, amount: out.amount >= i.value ? 'all' : out.amount }); if (r.ok) setOut(null); }}>OK</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setOut({ id: i.id, amount: i.value })}>{i.kind === 'etf' ? 'Verkaufen' : 'Auszahlen'}</Button>
                    ),
                },
              ]}
            />
            {history.length > 1 && (
              <CardBody>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="p" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip formatter={(v: number) => formatMoney(Math.round(v * 100), { decimals: false })} />
                      <Area dataKey="v" name="Wert" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
