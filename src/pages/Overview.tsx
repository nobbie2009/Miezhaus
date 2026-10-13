import * as React from 'react';
import { AlertOctagon, ArrowRight, CalendarClock, HardHat, Info, Target, TriangleAlert, Wallet, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, Progress, Stat } from '@/components/ui';
import { BuildingView } from '@/features/building/BuildingView';
import { computeWarnings, liquidityForecast } from '@/game/warnings';
import { avgSatisfaction, buildingCondition, monthlyFixedCosts, monthlyLoanPayments, occupiedCount, overdueReceivables, targetRent, totalReceivables, vacancyRate } from '@/game/derived';
import { GOAL_BY_ID } from '@/content/goals';
import { computeScore, scoreGrade } from '@/game/score';
import { PHASES } from '@/game/progression';
import { formatDate, formatPeriod, monthKey } from '@/utils/date';
import { formatMoney, formatMoneyShort, formatPercent } from '@/utils/money';
import { cn } from '@/utils/misc';
import { JOB_STATUS_LABEL, Money } from '@/features/common';
import { DEFECT_TYPES } from '@/content/defects';
import { targetLabel } from '@/game/defects';

export function OverviewPage() {
  const s = useGs();
  const navigate = useUi((x) => x.navigate);
  const warnings = React.useMemo(() => computeWarnings(s), [s]);
  const forecast = React.useMemo(() => liquidityForecast(s), [s]);
  const score = React.useMemo(() => computeScore(s), [s]);
  const period = monthKey(s.day);
  const claims = s.claims.filter((c) => c.kind === 'rent' && c.period === period);
  const due = claims.reduce((a, c) => a + c.amount, 0);
  const collected = claims.reduce((a, c) => a + c.paid, 0);
  const prev = s.history[s.history.length - 1];
  const prev2 = s.history[s.history.length - 2];
  const sat = avgSatisfaction(s);
  const cond = buildingCondition(s);
  const running = monthlyFixedCosts(s) + monthlyLoanPayments(s) + forecast.energy;
  const jobs = s.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');
  const openRepairs = s.defects.filter((d) => d.resolvedDay === null && d.discovered && !d.jobId);
  const goals = s.goals.filter((g) => g.status === 'active').slice(0, 6);
  const nextPhase = PHASES[s.phase];
  const chart = s.history.slice(-12).map((h) => ({ p: formatPeriod(h.period), Kontostand: Math.round(h.cash / 100), Cashflow: Math.round(h.operatingCashflow / 100) }));

  const appointments: { day: number; text: string; page: string; id?: string }[] = [];
  for (const c of s.contracts) if (c.pendingIncrease) appointments.push({ day: c.pendingIncrease.effectiveDay, text: `Mieterhöhung wirksam (${s.apartments.find((a) => a.id === c.apartmentId)?.number})`, page: 'contracts', id: c.id });
  for (const t of s.tenants) if (t.moveOutDay && t.status === 'moving_out') appointments.push({ day: t.moveOutDay, text: `Auszug ${t.name}`, page: 'tenants', id: t.id });
  for (const j of jobs) if (j.status === 'scheduled') appointments.push({ day: j.startDay, text: `Arbeitsbeginn: ${j.title}`, page: 'repairs', id: j.id });
  for (const d of s.decisions) appointments.push({ day: d.expiresDay, text: `Frist: ${d.title}`, page: 'events' });
  if (s.counters.fireDeadline) appointments.push({ day: s.counters.fireDeadline, text: 'Frist Brandschutz-Nachrüstung', page: 'renovation' });
  if (s.endDay) appointments.push({ day: s.endDay, text: 'Ende der Szenario-Frist', page: 'goals' });
  appointments.sort((a, b) => a.day - b.day);

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Kontostand" value={formatMoney(s.cash, { decimals: false })} tone={s.cash < 0 ? 'danger' : undefined} trend={prev && prev2 ? Math.sign(prev.cash - prev2.cash) : null} sub={prev ? `Vormonat ${formatMoneyShort(prev.cash)}` : 'Startkapital'} hint="Verfügbares Guthaben auf dem Geschäftskonto. Der Dispositionsrahmen ist zusätzlich nutzbar, kostet aber 11,5 % Zinsen." onClick={() => navigate('finance')} />
        <Stat label="Sollmiete / Monat" value={formatMoney(targetRent(s), { decimals: false })} sub={`${occupiedCount(s)} von ${s.apartments.length} Wohnungen vermietet`} hint="Summe der vereinbarten Nettokaltmieten aller laufenden Verträge." onClick={() => navigate('contracts')} />
        <Stat label="Vereinnahmt (Monat)" value={formatMoney(collected, { decimals: false })} sub={due ? `${formatPercent(collected / due)} von ${formatMoneyShort(due)} fällig (inkl. NK)` : 'Keine Forderungen'} tone={due && collected / due < 0.8 && s.day % 30 > 10 ? 'warning' : undefined} hint="Zahlungseingänge auf die Mietforderungen des laufenden Monats (Kaltmiete + NK-Vorauszahlung, ggf. gemindert)." />
        <Stat label="Laufende Kosten / Monat" value={formatMoney(running, { decimals: false })} sub="Fixkosten, Kredite, Energie (geschätzt)" hint={`Fixkosten ${formatMoney(monthlyFixedCosts(s))}, Kreditraten ${formatMoney(monthlyLoanPayments(s))}, Energie ${formatMoney(forecast.energy)} (Vormonat bzw. Schätzung). Ohne Reparaturen.`} onClick={() => navigate('finance')} />
        <Stat label="Offene Forderungen" value={formatMoney(totalReceivables(s), { decimals: false })} tone={overdueReceivables(s) > 0 ? 'warning' : undefined} sub={`davon überfällig ${formatMoneyShort(overdueReceivables(s))}`} hint="Noch nicht bezahlte Mieten, Nachzahlungen und Schadensersatz." onClick={() => navigate('contracts')} />
        <Stat label="Leerstandsquote" value={formatPercent(vacancyRate(s))} tone={vacancyRate(s) > 0.15 ? 'warning' : undefined} sub={`${s.apartments.length - occupiedCount(s)} Wohnung(en) leer`} hint="Anteil nicht vermieteter Wohnungen. Leerstand kostet Miete und den Nebenkostenanteil." onClick={() => navigate('apartments')} />
        <Stat label="Ø Zufriedenheit" value={`${Math.round(sat)} %`} tone={sat >= 70 ? 'success' : sat < 45 ? 'danger' : 'warning'} trend={prev ? Math.sign(Math.round(sat - prev.avgSatisfaction)) : null} sub={prev ? `Vormonat ${Math.round(prev.avgSatisfaction)} %` : undefined} hint="Durchschnitt aller aktiven Mieter. Unter 35 % droht die Kündigung." onClick={() => navigate('tenants')} />
        <Stat label="Gebäudezustand" value={`${Math.round(cond)} %`} tone={cond >= 70 ? 'success' : cond < 45 ? 'danger' : 'warning'} trend={prev ? Math.sign(Math.round(cond - prev.buildingCondition)) : null} sub={`${openRepairs.length} offene Schäden`} hint="Gewichteter Zustand aller Bauteile (Dach, Fassade, Fenster, Heizung …)." onClick={() => navigate('building')} />
        <Stat label="Liquidität in 30 Tagen" value={formatMoney(forecast.projected, { decimals: false })} tone={forecast.projected < 0 ? 'danger' : forecast.projected < 300000 ? 'warning' : 'success'} sub={`Mieteingang ${formatPercent(forecast.collectionRate)} angenommen`} hint={`Konto ${formatMoney(forecast.cash)} + Mieten ${formatMoney(forecast.inflow)} − Fixkosten ${formatMoney(forecast.fixed)} − Kredite ${formatMoney(forecast.loans)} − Energie ${formatMoney(forecast.energy)} − Aufträge ${formatMoney(forecast.jobs)}`} />
        <Stat label="Bewertung" value={`${score.total}`} sub={scoreGrade(score.total)} hint="Gesamtbewertung 0–1000 aus Stabilität, Zustand, Zufriedenheit, Effizienz u. a." onClick={() => navigate('goals')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader title={s.building.name} subtitle={`${s.building.city} · ${s.apartments.length} Wohnungen · Phase ${s.phase}: ${PHASES[s.phase - 1].title}`} actions={<Button size="sm" variant="outline" onClick={() => navigate('building')}>Details <ArrowRight size={14} /></Button>} />
          <CardBody className="p-2 sm:p-4">
            <BuildingView s={s} className="mx-auto max-h-[560px] w-full max-w-3xl text-fg" onSelectApartment={(id) => navigate('apartments', id)} onSelectComponent={() => navigate('building')} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Warnungen & Hinweise" icon={<TriangleAlert size={16} />} subtitle={warnings.length ? `${warnings.length} Punkt(e)` : 'Alles im grünen Bereich'} />
          <CardBody className="scroll-thin max-h-[440px] space-y-2 overflow-y-auto">
            {!warnings.length && <p className="text-sm text-muted-fg">Keine akuten Probleme. Nutzen Sie die Zeit für Wartung und Modernisierung.</p>}
            {warnings.map((w) => (
              <div key={w.id} className={cn('rounded-lg border-l-4 bg-muted/50 p-3', w.severity === 'danger' ? 'border-danger' : w.severity === 'warning' ? 'border-warning' : 'border-info')}>
                <div className="flex items-start gap-2">
                  {w.severity === 'danger' ? <AlertOctagon size={15} className="mt-0.5 shrink-0 text-danger" /> : w.severity === 'warning' ? <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warning" /> : <Info size={15} className="mt-0.5 shrink-0 text-info" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{w.title}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-fg">{w.text}</div>
                    {w.action && (
                      <button className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" onClick={() => navigate(w.action!.page, w.action!.id ?? null)}>
                        {w.action.label} <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Aktive Aufträge" icon={<HardHat size={16} />} subtitle={`${jobs.length} laufend/geplant · ${openRepairs.length} Schäden ohne Auftrag`} actions={<Button size="sm" variant="ghost" onClick={() => navigate('repairs')}>Alle</Button>} />
          <CardBody className="space-y-3">
            {!jobs.length && <p className="text-sm text-muted-fg">Keine laufenden Aufträge.</p>}
            {jobs.slice(0, 5).map((j) => (
              <div key={j.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{j.title}</span>
                  <Badge tone={j.status === 'in_progress' ? 'primary' : 'neutral'}>{JOB_STATUS_LABEL[j.status]}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={(j.workedDays / j.estimatedDays) * 100} tone="primary" />
                  <span className="num shrink-0 text-xs text-muted-fg">{j.status === 'scheduled' ? `ab ${formatDate(j.startDay)}` : `${j.workedDays}/${j.estimatedDays} T.`}</span>
                </div>
              </div>
            ))}
            {openRepairs.slice(0, 3).map((d) => (
              <button key={d.id} onClick={() => navigate('repairs', d.id)} className="flex w-full items-center justify-between rounded-lg bg-warning/10 px-3 py-2 text-left text-xs">
                <span className="font-medium">
                  Offen: {d.severity >= 2 ? 'Dringend – ' : ''}
                  {DEFECT_TYPES[d.type].label} ({targetLabel(s, d.target)})
                </span>
                <ArrowRight size={12} />
              </button>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Ziele" icon={<Target size={16} />} subtitle={nextPhase ? `Nächste Phase: ${nextPhase.title}` : 'Höchste Phase erreicht'} actions={<Button size="sm" variant="ghost" onClick={() => navigate('goals')}>Alle</Button>} />
          <CardBody className="space-y-3">
            {goals.map((g) => {
              const def = GOAL_BY_ID[g.id];
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{def?.title}</span>
                    <Badge tone={def?.horizon === 'short' ? 'info' : def?.horizon === 'mid' ? 'primary' : 'accent'}>{def?.horizon === 'short' ? 'kurz' : def?.horizon === 'mid' ? 'mittel' : 'lang'}</Badge>
                  </div>
                  <Progress value={g.progress * 100} tone="primary" className="mt-1" />
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Anstehende Termine" icon={<CalendarClock size={16} />} />
          <CardBody className="space-y-1.5">
            {!appointments.length && <p className="text-sm text-muted-fg">Keine Termine.</p>}
            {appointments.slice(0, 8).map((a, i) => (
              <button key={i} onClick={() => navigate(a.page, a.id ?? null)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted">
                <span className="truncate">{a.text}</span>
                <span className="num shrink-0 text-xs text-muted-fg">{formatDate(a.day)}</span>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader title="Kontostand & operativer Cashflow" icon={<Wallet size={16} />} subtitle="Letzte 12 Monatsabschlüsse" />
          <CardBody>
            {chart.length < 2 ? (
              <p className="py-10 text-center text-sm text-muted-fg">Die Entwicklung wird nach den ersten Monatsabschlüssen sichtbar.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={chart}>
                    <defs>
                      <linearGradient id="gcash" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="p" tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} width={56} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <RTooltip formatter={(v: number) => `${v.toLocaleString('de-DE')} €`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area isAnimationActive={false} dataKey="Kontostand" stroke="hsl(var(--primary))" fill="url(#gcash)" strokeWidth={2} />
                    <Area isAnimationActive={false} dataKey="Cashflow" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Schnellaktionen" icon={<Zap size={16} />} />
          <CardBody className="grid gap-2">
            {s.apartments.filter((a) => a.status === 'vacant_ready' && !a.listing).slice(0, 2).map((a) => (
              <Button key={a.id} variant="outline" className="justify-between" onClick={() => navigate('apartments', a.id)}>
                Whg. {a.number} inserieren <ArrowRight size={14} />
              </Button>
            ))}
            {openRepairs.length > 0 && (
              <Button variant="outline" className="justify-between" onClick={() => navigate('repairs')}>
                {openRepairs.length} Schäden beauftragen <ArrowRight size={14} />
              </Button>
            )}
            {s.claims.some((c) => (c.status === 'open' || c.status === 'partial') && c.dueDay < s.day - 7) && (
              <Button variant="outline" className="justify-between" onClick={() => navigate('contracts')}>
                Rückstände mahnen <ArrowRight size={14} />
              </Button>
            )}
            <Button variant="outline" className="justify-between" onClick={() => navigate('renovation')}>
              Modernisierung planen <ArrowRight size={14} />
            </Button>
            {prev && (
              <div className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-fg">
                Letzter Monatsabschluss ({formatPeriod(prev.period)}): operativer Cashflow <Money cents={prev.operatingCashflow} colored />, Mieteingang {prev.rentDue ? formatPercent(prev.rentCollected / prev.rentDue) : '–'}.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
