import * as React from 'react';
import { Banknote, BookOpen, Landmark, LineChart, Shield } from 'lucide-react';
import type { LedgerCategory } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { useGame } from '@/store/gameStore';
import { Badge, Button, Card, CardBody, CardHeader, Confirm, DataTable, EuroInput, Field, KeyValue, Progress, Select, Stat, Tabs } from '@/components/ui';
import { CATEGORY_LABEL, INCOME_CATEGORIES, entriesInPeriod, summarize } from '@/game/ledger';
import { equity, equityRatio, liabilities, loanBalance, marketValue, receivablesByAge, totalReceivables } from '@/game/derived';
import { loanQuote } from '@/game/finance';
import { liquidityForecast } from '@/game/warnings';
import { formatDate, formatPeriodLong, monthKey } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/money';
import { Money } from '@/features/common';
import { CONFIG } from '@/game/config';

type Tab = 'statement' | 'journal' | 'loans' | 'liquidity' | 'insurance';

export function FinancePage() {
  const s = useGs();
  const [tab, setTab] = React.useState<Tab>('statement');
  const cur = summarize(entriesInPeriod(s, monthKey(s.day)));
  const last = s.history[s.history.length - 1];
  return (
    <div className="min-w-0 space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Kontostand" value={formatMoney(s.cash, { decimals: false })} tone={s.cash < 0 ? 'danger' : undefined} sub={`Dispo: ${formatMoney(s.overdraftLimit, { decimals: false })}`} hint="Tatsächlich verfügbares Geld. Kautionen liegen auf einem separaten Treuhandkonto." />
        <Stat label="Überschuss lfd. Monat" value={formatMoney(cur.net, { decimals: false })} tone={cur.net < 0 ? 'warning' : 'success'} sub={last ? `Vormonat ${formatMoney(last.income + last.expenses, { decimals: false })}` : 'bisher gebucht'} hint="Alle Einnahmen minus alle Ausgaben des laufenden Monats inkl. Investitionen und Tilgung. Monatskosten werden erst am Monatsende gebucht." />
        <Stat label="Operativer Cashflow (Vormonat)" value={last ? formatMoney(last.operatingCashflow, { decimals: false }) : '–'} tone={last && last.operatingCashflow < 0 ? 'danger' : 'success'} hint="Einnahmen minus laufende Ausgaben – ohne Investitionen (Renovierung/Modernisierung) und ohne Kreditauszahlung/Tilgung. Zinsen sind enthalten." />
        <Stat label="Offene Forderungen" value={formatMoney(totalReceivables(s), { decimals: false })} hint="Noch nicht bezahlte Mieten, Nachzahlungen und Schadensersatz." />
        <Stat label="Verbindlichkeiten" value={formatMoney(liabilities(s), { decimals: false })} hint="Restbeträge laufender Handwerkeraufträge und in Anspruch genommener Dispokredit." />
        <Stat label="Kreditrestschuld" value={formatMoney(loanBalance(s), { decimals: false })} hint="Summe aller offenen Darlehen." />
        <Stat label="Immobilienwert (geschätzt)" value={formatMoney(marketValue(s), { decimals: false })} hint="Ertragswertnah: Vergleichsmiete × 19 × Zustandsfaktor × Effizienzfaktor + Grundstück − Instandhaltungsrückstand. Kein verfügbares Geld!" />
        <Stat label="Eigenkapital (geschätzt)" value={formatMoney(equity(s), { decimals: false })} sub={`Quote ${formatPercent(equityRatio(s))}`} hint="Immobilienwert + Kontostand − Kredite − Verbindlichkeiten." />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'statement', label: 'Monatsabrechnung' },
          { id: 'journal', label: 'Buchungsjournal' },
          { id: 'loans', label: 'Kredite' },
          { id: 'liquidity', label: 'Liquidität & Forderungen' },
          { id: 'insurance', label: 'Versicherung & Steuern' },
        ]}
      />
      {tab === 'statement' && <Statement />}
      {tab === 'journal' && <Journal />}
      {tab === 'loans' && <Loans />}
      {tab === 'liquidity' && <Liquidity />}
      {tab === 'insurance' && <Insurance />}
    </div>
  );
}

function Statement() {
  const s = useGs();
  const periods = [monthKey(s.day), ...s.history.map((h) => h.period).reverse()];
  const [p, setP] = React.useState(periods[1] ?? periods[0]);
  const sum = summarize(entriesInPeriod(s, p));
  const cats = Object.entries(sum.byCategory) as [LedgerCategory, number][];
  const inc = cats.filter(([c]) => INCOME_CATEGORIES.includes(c)).sort((a, b) => b[1] - a[1]);
  const exp = cats.filter(([c]) => !INCOME_CATEGORIES.includes(c)).sort((a, b) => a[1] - b[1]);
  const snap = s.history.find((h) => h.period === p);
  return (
    <Card>
      <CardHeader title={`Monatsabrechnung ${formatPeriodLong(p)}`} subtitle={p === monthKey(s.day) ? 'Laufender Monat – Fixkosten und Energie werden am Monatsende gebucht' : 'Abgeschlossen'} icon={<BookOpen size={16} />} actions={<Select value={p} onChange={setP} options={periods.map((x) => ({ value: x, label: formatPeriodLong(x) }))} aria-label="Periode" className="h-8 w-44 text-xs" />} />
      <CardBody className="grid gap-6 lg:grid-cols-3">
        <div>
          <div className="label mb-2">Einnahmen</div>
          <Lines rows={inc} />
          <Total label="Summe Einnahmen" v={sum.income} />
        </div>
        <div>
          <div className="label mb-2">Ausgaben</div>
          <Lines rows={exp} />
          <Total label="Summe Ausgaben" v={sum.expenses} />
        </div>
        <div className="space-y-3">
          <div className="label">Ergebnis</div>
          <KeyValue
            items={[
              ['Operativer Cashflow', <Money key="o" cents={sum.operatingCashflow} colored />],
              ['Investitionen', <Money key="i" cents={sum.investments} colored />],
              ['Finanzierung (Saldo)', <Money key="f" cents={sum.financing} colored />],
              ['Veränderung Kontostand', <Money key="n" cents={sum.net} colored />],
            ]}
          />
          {snap && (
            <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-xs">
              <KeyValue
                items={[
                  ['Sollmiete inkl. NK', <Money key="a" cents={snap.rentDue} />],
                  ['Davon eingegangen', <Money key="b" cents={snap.rentCollected} />],
                  ['Mietzahlungsquote', snap.rentDue ? formatPercent(snap.rentCollected / snap.rentDue, 1) : '–'],
                  ['Kontostand Monatsende', <Money key="c" cents={snap.cash} />],
                  ['Kosten je m² (operativ)', formatMoney(Math.round(-(snap.expenses - snap.investments - Math.min(0, snap.financingCashflow)) / Math.max(1, s.apartments.reduce((x, y) => x + y.area, 0))))],
                ]}
              />
            </div>
          )}
          <p className="text-xs text-muted-fg">Alle Werte werden direkt aus dem Buchungsjournal berechnet.</p>
        </div>
      </CardBody>
    </Card>
  );
}

const Lines = ({ rows }: { rows: [LedgerCategory, number][] }) => (
  <div className="space-y-1 text-sm">
    {rows.length === 0 && <div className="text-muted-fg">–</div>}
    {rows.map(([c, v]) => (
      <div key={c} className="flex justify-between gap-2">
        <span className="text-muted-fg">{CATEGORY_LABEL[c]}</span>
        <Money cents={v} colored />
      </div>
    ))}
  </div>
);
const Total = ({ label, v }: { label: string; v: number }) => (
  <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold">
    <span>{label}</span>
    <Money cents={v} />
  </div>
);

function Journal() {
  const s = useGs();
  const [cat, setCat] = React.useState<string>('all');
  const [q, setQ] = React.useState('');
  const rows = React.useMemo(
    () => [...s.ledger].reverse().filter((e) => (cat === 'all' || (cat === 'in' ? e.amount > 0 : cat === 'out' ? e.amount < 0 : e.category === cat)) && (!q || e.purpose.toLowerCase().includes(q.toLowerCase()))),
    [s.ledger, cat, q],
  );
  return (
    <Card>
      <CardHeader
        title="Buchungsjournal"
        subtitle={`${s.ledger.length} Buchungen · Kontrollsumme: Startkapital ${formatMoney(s.startCash)} + Buchungen = Kontostand`}
        icon={<BookOpen size={16} />}
        actions={
          <div className="flex gap-2">
            <input className="input h-8 w-40 text-xs" placeholder="Verwendungszweck …" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Suche im Journal" />
            <Select className="h-8 w-44 text-xs" value={cat} onChange={setCat} aria-label="Kategorie" options={[{ value: 'all', label: 'Alle Kategorien' }, { value: 'in', label: 'Nur Einnahmen' }, { value: 'out', label: 'Nur Ausgaben' }, ...Object.entries(CATEGORY_LABEL).map(([k, v]) => ({ value: k, label: v }))]} />
          </div>
        }
      />
      <DataTable
        rows={rows}
        rowKey={(e) => e.id}
        pageSize={25}
        empty="Keine Buchungen."
        columns={[
          { key: 'd', header: 'Datum', cell: (e) => <span className="num">{formatDate(e.day)}</span>, sort: (e) => e.day },
          { key: 'c', header: 'Kategorie', cell: (e) => <Badge tone={e.amount >= 0 ? 'success' : 'neutral'}>{CATEGORY_LABEL[e.category]}</Badge>, sort: (e) => e.category },
          { key: 'p', header: 'Verwendungszweck', cell: (e) => <span className="text-xs">{e.purpose}</span> },
          { key: 'w', header: 'Bezug', cell: (e) => <span className="text-xs text-muted-fg">{e.apartmentId ? s.apartments.find((a) => a.id === e.apartmentId)?.number : e.componentKey ?? ''}</span> },
          { key: 'r', header: 'Referenz', cell: (e) => <span className="font-mono text-[10px] text-muted-fg">{e.ref ? `${e.ref.type}:${e.ref.id}` : ''}</span> },
          { key: 'a', header: 'Betrag', align: 'right', cell: (e) => <Money cents={e.amount} colored signed />, sort: (e) => e.amount },
        ]}
      />
    </Card>
  );
}

function Loans() {
  const s = useGs();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const [amount, setAmount] = React.useState(2000000);
  const [years, setYears] = React.useState(15);
  const [confirm, setConfirm] = React.useState(false);
  const [repay, setRepay] = React.useState<{ id: string; amount: number } | null>(null);
  const q = loanQuote(s, amount, years);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader title="Darlehen" icon={<Landmark size={16} />} subtitle={`Restschuld gesamt ${formatMoney(loanBalance(s))}`} />
        <CardBody className="space-y-3">
          {s.loans.length === 0 && <p className="text-sm text-muted-fg">Keine Kredite.</p>}
          {s.loans.map((l) => (
            <div key={l.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{l.name}</div>
                  <div className="text-xs text-muted-fg">
                    {(l.annualRate * 100).toFixed(2)} % p. a. · Rate {formatMoney(l.monthlyPayment)} · seit {formatDate(l.startDay)} · {l.purpose}
                  </div>
                </div>
                {l.remaining > 0 ? (
                  <Button size="sm" variant="outline" onClick={() => setRepay({ id: l.id, amount: Math.min(l.remaining, Math.max(100000, Math.floor(Math.max(0, s.cash) / 100000) * 100000)) })}>
                    Sondertilgung
                  </Button>
                ) : (
                  <Badge tone="success">getilgt</Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={(1 - l.remaining / l.principal) * 100} tone="success" />
                <span className="num shrink-0 text-xs">
                  <Money cents={l.remaining} decimals={false} /> offen
                </span>
              </div>
              {repay?.id === l.id && (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-muted/60 p-3">
                  <Field label="Betrag" hint={`Vorfälligkeitsentgelt ${CONFIG.finance.earlyRepaymentFee * 100} %`}>
                    <EuroInput value={repay.amount} onChange={(v) => setRepay({ ...repay, amount: v })} max={l.remaining} aria-label="Sondertilgung Betrag" />
                  </Field>
                  <Button size="sm" disabled={busy} onClick={() => { const r = dispatch({ type: 'repayLoan', loanId: l.id, amount: repay.amount }); if (r.ok) setRepay(null); }}>
                    Tilgen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRepay(null)}>
                    Abbrechen
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Kredit aufnehmen" icon={<Banknote size={16} />} subtitle={`Aktueller Marktzins ${(s.market.interestRate * 100).toFixed(2)} %`} />
        <CardBody className="space-y-3">
          <Field label="Betrag" hint={`Maximal ${formatMoney(q.maxAmount, { decimals: false })} (Beleihung bis 80 % des Marktwerts)`}>
            <EuroInput value={amount} onChange={setAmount} min={500000} max={q.maxAmount} step={1000} aria-label="Kreditbetrag" />
          </Field>
          <Field label={`Laufzeit: ${years} Jahre`}>
            <input type="range" min={1} max={30} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" aria-label="Laufzeit" />
          </Field>
          <KeyValue
            items={[
              ['Zinssatz', `${(q.annualRate * 100).toFixed(2)} % p. a.`],
              ['Monatliche Rate', <Money key="r" cents={q.monthlyPayment} />],
              ['Zinskosten gesamt', <Money key="z" cents={q.totalInterest} decimals={false} />],
              ['Beleihungsquote danach', formatPercent(q.ltvAfter)],
            ]}
          />
          <Button className="w-full" disabled={busy || amount > q.maxAmount || amount < 500000} onClick={() => setConfirm(true)}>
            Kredit beantragen
          </Button>
          <p className="text-xs text-muted-fg">Kredite erhöhen die Liquidität, aber auch die monatliche Belastung. Höhere Beleihung → höherer Zins.</p>
        </CardBody>
      </Card>
      <Confirm open={confirm} onOpenChange={setConfirm} title="Kredit aufnehmen?" text={`${formatMoney(amount)} für ${years} Jahre zu ${(q.annualRate * 100).toFixed(2)} %. Monatliche Rate: ${formatMoney(q.monthlyPayment)}.`} confirmLabel="Kredit aufnehmen" onConfirm={() => dispatch({ type: 'takeLoan', amount, years })} />
    </div>
  );
}

function Liquidity() {
  const s = useGs();
  const f = liquidityForecast(s);
  const age = receivablesByAge(s);
  const rows: [string, number][] = [
    ['Kontostand heute', f.cash],
    [`Erwartete Mieteingänge (${formatPercent(f.collectionRate)})`, f.inflow],
    ['Fixkosten (Versicherung, Dienste, Steuern …)', -f.fixed],
    ['Kreditraten', -f.loans],
    ['Energie & Wasser', -f.energy],
    ['Fällige Handwerkerzahlungen', -f.jobs],
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Liquiditätsprognose 30 Tage" icon={<LineChart size={16} />} />
        <CardBody className="space-y-1.5 text-sm">
          {rows.map(([l, v]) => (
            <div key={l} className="flex justify-between gap-2">
              <span className="text-muted-fg">{l}</span>
              <Money cents={v} colored={v < 0} />
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Prognose</span>
            <Money cents={f.projected} colored />
          </div>
          {f.projected < 0 && <p className="rounded-lg bg-danger/10 p-2 text-xs text-danger">Die Liquidität reicht voraussichtlich nicht. Möglichkeiten: Kredit aufnehmen, Aufträge verschieben, Rückstände eintreiben, Dienstleistungen reduzieren.</p>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Mietrückstände nach Alter" />
        <CardBody className="space-y-2 text-sm">
          {(
            [
              ['bis 30 Tage', age.d30],
              ['31–60 Tage', age.d60],
              ['61–90 Tage', age.d90],
              ['über 90 Tage', age.over90],
            ] as [string, number][]
          ).map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-muted-fg">{l}</span>
              <Money cents={v} className={v > 0 ? 'text-danger' : ''} />
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-fg">Rückstände verwalten Sie unter „Verträge“ (Mahnwesen, Ratenzahlung, Kündigung).</p>
        </CardBody>
      </Card>
    </div>
  );
}

function Insurance() {
  const s = useGs();
  const taxes = s.ledger.filter((e) => e.category === 'tax');
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Versicherungsfälle" icon={<Shield size={16} />} subtitle={`Tarif: ${{ none: 'keine Versicherung', basic: 'Basis', comfort: 'Komfort' }[s.services.insurance]}`} />
        <DataTable
          rows={[...s.insuranceClaims].reverse()}
          rowKey={(c) => c.id}
          empty="Keine Versicherungsfälle."
          columns={[
            { key: 'd', header: 'Gemeldet', cell: (c) => formatDate(c.filedDay) },
            { key: 't', header: 'Schaden', cell: (c) => c.description },
            { key: 'a', header: 'Betrag', align: 'right', cell: (c) => <Money cents={c.amountClaimed} decimals={false} /> },
            { key: 's', header: 'Status', cell: (c) => <Badge tone={c.status === 'paid' ? 'success' : c.status === 'pending' ? 'info' : 'danger'}>{c.status === 'paid' ? `gezahlt ${formatMoney(c.payout, { decimals: false })}` : c.status === 'pending' ? `in Prüfung bis ${formatDate(c.decisionDay)}` : 'abgelehnt'}</Badge> },
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Steuern (vereinfacht)" subtitle={`${CONFIG.finance.taxRate * 100} % auf den Vorjahresüberschuss nach Abschreibung, fällig Ende April`} />
        <CardBody>
          {taxes.length === 0 && <p className="text-sm text-muted-fg">Noch keine Steuerbescheide.</p>}
          {taxes.map((e) => (
            <div key={e.id} className="flex justify-between text-sm">
              <span>{e.purpose}</span>
              <Money cents={e.amount} colored />
            </div>
          ))}
          <p className="mt-3 text-xs text-muted-fg">Spielmechanik – keine Steuerberatung. Tilgung ist nicht abzugsfähig, Modernisierungen werden über 10 Jahre abgeschrieben.</p>
        </CardBody>
      </Card>
    </div>
  );
}
