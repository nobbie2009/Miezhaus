import * as React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import type { Snapshot } from '@/domain/schema';
import { useGs } from '@/hooks/useGameState';
import { Card, CardBody, CardHeader, Empty, InfoTip, Tabs } from '@/components/ui';
import { formatPeriod } from '@/utils/date';
import { totalArea } from '@/game/derived';

type Gran = 'month' | 'quarter' | 'year';
type Range = '12' | '36' | 'all';

interface Row {
  p: string;
  Einnahmen: number;
  Ausgaben: number;
  Cashflow: number;
  Kontostand: number;
  'bis 30 T.': number;
  '31–60 T.': number;
  '61–90 T.': number;
  'über 90 T.': number;
  Sollmiete: number;
  Mieteingang: number;
  Leerstand: number;
  Zufriedenheit: number;
  Reparaturen: number;
  Investitionen: number;
  kWh: number;
  Energiekosten: number;
  Marktwert: number;
  Eigenkapital: number;
  Kredite: number;
  'Kosten/m²': number;
  Rückstand: number;
  Bewertung: number;
  Zustand: number;
}

const eur = (c: number) => Math.round(c / 100);

function aggregate(hist: Snapshot[], gran: Gran, area: number): Row[] {
  const groups = new Map<string, Snapshot[]>();
  for (const h of hist) {
    const [y, m] = h.period.split('-').map(Number);
    const key = gran === 'month' ? h.period : gran === 'quarter' ? `${y} Q${Math.ceil(m / 3)}` : String(y);
    groups.set(key, [...(groups.get(key) ?? []), h]);
  }
  return [...groups.entries()].map(([k, hs]) => {
    const last = hs[hs.length - 1];
    const sum = (f: (h: Snapshot) => number) => hs.reduce((a, h) => a + f(h), 0);
    const avg = (f: (h: Snapshot) => number) => sum(f) / hs.length;
    const opCosts = sum((h) => -(h.expenses - h.investments - Math.min(0, h.financingCashflow)));
    return {
      p: gran === 'month' ? formatPeriod(k) : k,
      Einnahmen: eur(sum((h) => h.income - Math.max(0, h.financingCashflow))),
      Ausgaben: eur(-sum((h) => h.expenses)),
      Cashflow: eur(sum((h) => h.operatingCashflow)),
      Kontostand: eur(last.cash),
      'bis 30 T.': eur(last.arrears30),
      '31–60 T.': eur(last.arrears60),
      '61–90 T.': eur(last.arrears90),
      'über 90 T.': eur(last.arrearsOver90),
      Sollmiete: eur(sum((h) => h.netRentMonthly)),
      Mieteingang: eur(sum((h) => h.rentCollected)),
      Leerstand: Math.round(avg((h) => h.vacancyRate) * 1000) / 10,
      Zufriedenheit: Math.round(avg((h) => h.avgSatisfaction)),
      Reparaturen: eur(sum((h) => h.repairCosts)),
      Investitionen: eur(-sum((h) => h.investments)),
      kWh: Math.round(sum((h) => h.energyKwh)),
      Energiekosten: eur(sum((h) => h.energyCost)),
      Marktwert: eur(last.marketValue),
      Eigenkapital: eur(last.equity),
      Kredite: eur(last.loanBalance),
      'Kosten/m²': Math.round((opCosts / 100 / area / hs.length) * 100) / 100,
      Rückstand: eur(last.backlogCost),
      Bewertung: Math.round(last.score),
      Zustand: Math.round(last.buildingCondition),
    };
  });
}

const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };
const axis = { fontSize: 11, fill: 'hsl(var(--muted-fg))' };
const C = { p: 'hsl(var(--primary))', a: 'hsl(var(--accent))', s: 'hsl(var(--success))', d: 'hsl(var(--danger))', w: 'hsl(var(--warning))', i: 'hsl(var(--info))' };

function ChartCard({ title, hint, children }: { title: string; hint: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-1.5">{title} <InfoTip text={hint} /></span>} />
      <CardBody>
        <div className="h-56">
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

export function StatisticsPage() {
  const s = useGs();
  const [gran, setGran] = React.useState<Gran>('month');
  const [range, setRange] = React.useState<Range>('36');
  const hist = range === 'all' ? s.history : s.history.slice(-Number(range));
  const data = React.useMemo(() => aggregate(hist, gran, totalArea(s)), [hist, gran, s]);
  if (!s.history.length) return <Card><Empty title="Noch keine Daten" text="Statistiken entstehen mit jedem Monatsabschluss." /></Card>;
  const common = { data, margin: { top: 5, right: 8, bottom: 0, left: 0 } };
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />;
  const x = <XAxis dataKey="p" tick={axis} />;
  const y = (w = 56) => <YAxis tick={axis} width={w} tickFormatter={(v: number) => (Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}k` : v.toLocaleString('de-DE'))} />;
  const tt = <RTooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toLocaleString('de-DE')} />;
  const lg = <Legend wrapperStyle={{ fontSize: 12 }} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={gran} onChange={setGran} items={[{ id: 'month', label: 'Monat' }, { id: 'quarter', label: 'Quartal' }, { id: 'year', label: 'Jahr' }]} />
        <Tabs value={range} onChange={setRange} items={[{ id: '12', label: '12 Monate' }, { id: '36', label: '36 Monate' }, { id: 'all', label: 'Gesamtverlauf' }]} />
        <span className="text-xs text-muted-fg">Alle Werte stammen aus Monatsabschlüssen und dem Buchungsjournal. Beträge in €.</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <ChartCard title="Einnahmen & Ausgaben" hint="Summe aller Buchungen je Zeitraum, ohne Kreditauszahlungen. Ausgaben inklusive Investitionen und Tilgung.">
          <BarChart {...common}>{grid}{x}{y()}{tt}{lg}<Bar dataKey="Einnahmen" fill={C.s} /><Bar dataKey="Ausgaben" fill={C.d} /></BarChart>
        </ChartCard>
        <ChartCard title="Operativer Cashflow" hint="Einnahmen minus laufende Ausgaben (inkl. Zinsen), ohne Investitionen und Kreditbewegungen.">
          <BarChart {...common}>{grid}{x}{y()}{tt}<Bar dataKey="Cashflow" fill={C.p} /></BarChart>
        </ChartCard>
        <ChartCard title="Kontostand" hint="Kontostand zum jeweiligen Monatsende.">
          <AreaChart {...common}>{grid}{x}{y()}{tt}<Area dataKey="Kontostand" stroke={C.p} fill={C.p} fillOpacity={0.15} strokeWidth={2} /></AreaChart>
        </ChartCard>
        <ChartCard title="Mietrückstände nach Alter" hint="Überfällige Forderungen zum Periodenende, gestaffelt nach Tagen seit Fälligkeit.">
          <BarChart {...common}>{grid}{x}{y()}{tt}{lg}<Bar dataKey="bis 30 T." stackId="a" fill={C.w} /><Bar dataKey="31–60 T." stackId="a" fill={C.a} /><Bar dataKey="61–90 T." stackId="a" fill={C.d} /><Bar dataKey="über 90 T." stackId="a" fill="#7f1d1d" /></BarChart>
        </ChartCard>
        <ChartCard title="Nettomieten: Soll & Eingang" hint="Sollmiete = vereinbarte Nettokaltmieten; Mieteingang = tatsächlich gezahlte Beträge auf Mietforderungen (inkl. NK-Anteil).">
          <LineChart {...common}>{grid}{x}{y()}{tt}{lg}<Line dataKey="Sollmiete" stroke={C.p} strokeWidth={2} dot={false} /><Line dataKey="Mieteingang" stroke={C.s} strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <ChartCard title="Leerstand & Zufriedenheit" hint="Durchschnittliche Leerstandsquote (%) und Ø Mieterzufriedenheit (%).">
          <LineChart {...common}>{grid}{x}{y(36)}{tt}{lg}<Line dataKey="Leerstand" stroke={C.d} strokeWidth={2} dot={false} /><Line dataKey="Zufriedenheit" stroke={C.s} strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <ChartCard title="Reparaturen & Investitionen" hint="Reparatur- und Wartungskosten bzw. Renovierungs-/Modernisierungsausgaben.">
          <BarChart {...common}>{grid}{x}{y()}{tt}{lg}<Bar dataKey="Reparaturen" fill={C.w} /><Bar dataKey="Investitionen" fill={C.i} /></BarChart>
        </ChartCard>
        <ChartCard title="Energieverbrauch & -kosten" hint="Wärme (Heizung + Warmwasser) und Allgemeinstrom in kWh sowie Energiekosten in € (nach Einspeisevergütung).">
          <LineChart {...common}>{grid}{x}<YAxis yAxisId="l" tick={axis} width={56} /><YAxis yAxisId="r" orientation="right" tick={axis} width={44} />{tt}{lg}<Line yAxisId="l" dataKey="kWh" stroke={C.a} strokeWidth={2} dot={false} /><Line yAxisId="r" dataKey="Energiekosten" stroke={C.d} strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <ChartCard title="Immobilienwert, Eigenkapital & Kredite" hint="Geschätzter Marktwert, Eigenkapital (Wert + Konto − Schulden) und Kreditrestschuld zum Periodenende.">
          <LineChart {...common}>{grid}{x}{y(60)}{tt}{lg}<Line dataKey="Marktwert" stroke={C.p} strokeWidth={2} dot={false} /><Line dataKey="Eigenkapital" stroke={C.s} strokeWidth={2} dot={false} /><Line dataKey="Kredite" stroke={C.d} strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <ChartCard title="Betriebskosten je m² und Monat" hint="Operative Ausgaben (ohne Investitionen und Tilgung) geteilt durch Wohnfläche und Monate.">
          <LineChart {...common}>{grid}{x}{y(40)}{tt}<Line dataKey="Kosten/m²" stroke={C.a} strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <ChartCard title="Instandhaltungsrückstand" hint="Kosten offener bekannter Schäden plus anteilige Erneuerungskosten stark verschlissener Bauteile.">
          <AreaChart {...common}>{grid}{x}{y()}{tt}<Area dataKey="Rückstand" stroke={C.d} fill={C.d} fillOpacity={0.15} strokeWidth={2} /></AreaChart>
        </ChartCard>
        <ChartCard title="Bewertung & Gebäudezustand" hint="Gesamtbewertung (0–1000) und gewichteter Gebäudezustand (%).">
          <LineChart {...common}>{grid}{x}<YAxis yAxisId="l" tick={axis} width={40} /><YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={axis} width={32} />{tt}{lg}<Line yAxisId="l" dataKey="Bewertung" stroke={C.p} strokeWidth={2} dot={false} /><Line yAxisId="r" dataKey="Zustand" stroke={C.w} strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
      </div>
    </div>
  );
}
