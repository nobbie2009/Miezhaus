import * as React from 'react';
import { FileText, Gavel, Scale, TrendingUp } from 'lucide-react';
import type { Claim, Contract } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { useGame } from '@/store/gameStore';
import { Badge, Button, Card, CardBody, CardHeader, Confirm, DataTable, Empty, EuroInput, Field, KeyValue, Tabs, Tip } from '@/components/ui';
import { rentIncreaseCheck } from '@/game/contracts';
import { canDun, contractArrears, DUNNING_LABEL } from '@/game/payments';
import { claimOutstanding, comparableRent } from '@/game/derived';
import { CONFIG } from '@/game/config';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { Money } from '@/features/common';

export function ContractsPage() {
  const s = useGs();
  const { focusId } = useUi();
  const [tab, setTab] = React.useState<'contracts' | 'claims'>('contracts');
  const list = s.contracts.filter((c) => c.status !== 'ended');
  const [sel, setSel] = React.useState<string | null>(focusId ?? list[0]?.id ?? null);
  React.useEffect(() => {
    if (focusId && s.contracts.some((c) => c.id === focusId)) {
      setSel(focusId);
      setTab('contracts');
    }
  }, [focusId, s.contracts]);
  const c = s.contracts.find((x) => x.id === sel) ?? null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onChange={setTab} items={[{ id: 'contracts', label: 'Mietverträge' }, { id: 'claims', label: 'Forderungen & Mahnwesen', badge: <Badge tone="warning">{s.claims.filter((x) => (x.status === 'open' || x.status === 'partial') && x.dueDay < s.day).length}</Badge> }]} />
        <p className="ml-auto flex items-center gap-1.5 text-xs text-muted-fg">
          <Scale size={13} /> Vereinfachtes Spielregelwerk – keine rechtsverbindliche Mietrechtsberatung.
        </p>
      </div>
      {tab === 'contracts' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader title="Laufende Mietverträge" icon={<FileText size={16} />} subtitle={`${list.length} Verträge · Sollmiete ${formatMoney(list.reduce((a, x) => a + x.netRent, 0))}`} />
            <DataTable
              rows={list}
              rowKey={(x) => x.id}
              selectedKey={sel}
              onRowClick={(x) => setSel(x.id)}
              initialSort={{ key: 'apt', dir: 1 }}
              columns={[
                { key: 'apt', header: 'Whg.', cell: (x) => s.apartments.find((a) => a.id === x.apartmentId)?.number, sort: (x) => s.apartments.find((a) => a.id === x.apartmentId)?.number ?? '' },
                { key: 't', header: 'Mieter', cell: (x) => s.tenants.find((t) => t.id === x.tenantId)?.name },
                { key: 'r', header: 'Kalt', align: 'right', cell: (x) => <Money cents={x.netRent} decimals={false} />, sort: (x) => x.netRent },
                { key: 'v', header: 'vs. Vergleich', align: 'right', cell: (x) => { const a = s.apartments.find((y) => y.id === x.apartmentId)!; const r = x.netRent / comparableRent(s, a); return <span className={r > 1.05 ? 'text-danger' : r < 0.9 ? 'text-success' : ''}>{Math.round(r * 100)} %</span>; }, sort: (x) => x.netRent / comparableRent(s, s.apartments.find((y) => y.id === x.apartmentId)!) },
                { key: 'o', header: 'Rückstand', align: 'right', cell: (x) => { const ar = contractArrears(s, x); return ar > 0 ? <Money cents={ar} decimals={false} className="text-danger" /> : <span className="text-muted-fg">–</span>; }, sort: (x) => contractArrears(s, x) },
                { key: 's', header: 'Status', cell: (x) => (x.status === 'notice' ? <Badge tone="warning">gekündigt</Badge> : x.pendingIncrease ? <Badge tone="info">Erhöhung angek.</Badge> : <Badge tone="success">aktiv</Badge>) },
              ]}
            />
          </Card>
          {c ? <ContractDetail c={c} /> : <Card><Empty title="Kein Vertrag gewählt" /></Card>}
        </div>
      ) : (
        <ClaimsTable claims={s.claims.filter((x) => x.status === 'open' || x.status === 'partial')} />
      )}
    </div>
  );
}

function ContractDetail({ c }: { c: Contract }) {
  const s = useGs();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const t = s.tenants.find((x) => x.id === c.tenantId)!;
  const a = s.apartments.find((x) => x.id === c.apartmentId)!;
  const chk = rentIncreaseCheck(s, c);
  const [kind, setKind] = React.useState<'comparable' | 'modernization'>(chk.maxByComparable > c.netRent ? 'comparable' : 'modernization');
  const maxNew = kind === 'comparable' ? chk.maxByComparable : c.netRent + chk.maxModernization;
  const [newRent, setNewRent] = React.useState(maxNew);
  React.useEffect(() => setNewRent(maxNew), [maxNew, c.id]);
  const arrears = contractArrears(s, c);
  const [plan, setPlan] = React.useState(Math.max(Math.ceil(arrears / 6 / 100) * 100, 5000));
  const [confirm, setConfirm] = React.useState<null | 'terminate' | 'mutual' | 'increase'>(null);
  const [comp, setComp] = React.useState(c.netRent * 3);
  const pct = (newRent - c.netRent) / c.netRent;
  const threshold = (c.netRent + c.utilityPrepayment) * CONFIG.dunning.terminationArrearsMonths;
  return (
    <div className="min-w-0 space-y-5">
      <Card>
        <CardHeader title={`Mietvertrag Whg. ${a.number} – ${t.name}`} subtitle={`Seit ${formatDate(c.startDay)}${c.endDay ? ` · endet ${formatDate(c.endDay)}` : ' · unbefristet'}`} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <KeyValue
            items={[
              ['Nettokaltmiete', <Money key="a" cents={c.netRent} />],
              ['NK-Vorauszahlung', <Money key="b" cents={c.utilityPrepayment} />],
              ['Warmmiete', <Money key="c" cents={c.netRent + c.utilityPrepayment} />],
              ['Kaution (Treuhand)', <Money key="d" cents={c.depositHeld} />],
              ['Fälligkeit', `${c.dueDay}. des Monats`],
              ['Letzte Erhöhung', c.lastRentIncreaseDay ? formatDate(c.lastRentIncreaseDay) : '–'],
              ['Vergleichsmiete', <Money key="e" cents={chk.comparable} />],
              ['Offener Rückstand', <Money key="f" cents={arrears} className={arrears > 0 ? 'text-danger' : ''} />],
            ]}
          />
          <div>
            <div className="label mb-1">Vertragshistorie</div>
            <ul className="scroll-thin max-h-48 space-y-1 overflow-y-auto text-xs">
              {[...c.changes].reverse().map((ch, i) => (
                <li key={i}>
                  <span className="num text-muted-fg">{formatDate(ch.day)}</span> – {ch.text}
                </li>
              ))}
            </ul>
            {c.specialTerms.length > 0 && <div className="mt-2 text-xs">Sondervereinbarungen: {c.specialTerms.join('; ')}</div>}
            {c.paymentPlan && <Badge tone="info" className="mt-2">Ratenzahlung {formatMoney(c.paymentPlan.monthlyAmount)}/Monat</Badge>}
          </div>
        </CardBody>
      </Card>
      {c.status === 'active' && (
        <Card>
          <CardHeader title="Mietanpassung prüfen" icon={<TrendingUp size={16} />} subtitle="Vergleichsmiete, Kappungsgrenze (20 %/3 J.), Sperrfrist 12 Monate, Wirksamkeit nach 3 Monaten" />
          <CardBody className="space-y-3">
            {c.pendingIncrease ? (
              <p className="text-sm">
                Angekündigt: {formatMoney(c.pendingIncrease.newRent)} ab {formatDate(c.pendingIncrease.effectiveDay)}.
              </p>
            ) : (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="text-xs text-muted-fg">Bis Vergleichsmiete/Kappung</div>
                    <div className="num font-semibold">{chk.maxByComparable > c.netRent ? `bis ${formatMoney(chk.maxByComparable)}` : 'nicht möglich'}</div>
                    {s.day < chk.earliestDay && <div className="text-[11px] text-warning">frühestens {formatDate(chk.earliestDay)}</div>}
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2">
                    <div className="text-xs text-muted-fg">Modernisierungsumlage</div>
                    <div className="num font-semibold">{chk.maxModernization > 0 ? `+${formatMoney(chk.maxModernization)}/Monat` : 'keine Modernisierung offen'}</div>
                  </div>
                </div>
                {chk.allowed ? (
                  <>
                    <div className="flex flex-wrap items-end gap-2">
                      <Tabs value={kind} onChange={setKind} items={[{ id: 'comparable', label: 'Vergleichsmiete' }, { id: 'modernization', label: 'Modernisierung' }]} />
                      <Field label="Neue Kaltmiete" className="w-40">
                        <EuroInput value={newRent} onChange={setNewRent} max={maxNew} aria-label="Neue Kaltmiete" />
                      </Field>
                      <Button disabled={busy || newRent <= c.netRent || newRent > maxNew} onClick={() => setConfirm('increase')}>
                        Ankündigen
                      </Button>
                    </div>
                    <p className="text-xs text-muted-fg">
                      Erhöhung um {formatMoney(newRent - c.netRent)} ({Math.round(pct * 100)} %). Warmmiete danach {Math.round(((newRent + c.utilityPrepayment) / t.monthlyIncome) * 100)} % des Einkommens. Zufriedenheit aktuell {Math.round(t.satisfaction)} % – stärkere Erhöhungen erhöhen das Auszugsrisiko.
                    </p>
                  </>
                ) : (
                  <ul className="text-xs text-muted-fg">{chk.reasons.map((r) => <li key={r}>• {r}</li>)}</ul>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}
      {c.status === 'active' && (
        <Card>
          <CardHeader title="Rückstände & Vertragsende" icon={<Gavel size={16} />} />
          <CardBody className="space-y-3">
            {arrears > 0 && !c.paymentPlan && (
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Ratenzahlung (monatlich)" hint={`Rückstand ${formatMoney(arrears)} · max. 12 Monate`} className="w-48">
                  <EuroInput value={plan} onChange={setPlan} aria-label="Monatliche Rate" />
                </Field>
                <Button variant="outline" disabled={busy} onClick={() => dispatch({ type: 'paymentPlan', contractId: c.id, monthlyAmount: plan })}>
                  Ratenzahlung vereinbaren
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Tip content={arrears < threshold ? `Erst ab ${formatMoney(threshold)} Rückstand (2 Monatsmieten) möglich.` : 'Fristlose Kündigung, Räumung in 60 Tagen. Anwaltskosten fallen an.'}>
                <span>
                  <Button variant="danger" disabled={arrears < threshold} onClick={() => setConfirm('terminate')}>
                    Fristlos kündigen
                  </Button>
                </span>
              </Tip>
              <Field label="Abfindung" className="w-36">
                <EuroInput value={comp} onChange={setComp} aria-label="Abfindung" />
              </Field>
              <Button variant="outline" className="self-end" onClick={() => setConfirm('mutual')}>
                Aufhebungsvertrag anbieten
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
      <ClaimsTable claims={s.claims.filter((x) => x.contractId === c.id).slice(-12).reverse()} compact />
      <Confirm open={confirm === 'increase'} onOpenChange={(v) => !v && setConfirm(null)} title="Mieterhöhung ankündigen?" text={`Neue Kaltmiete ${formatMoney(newRent)} (+${Math.round(pct * 100)} %), wirksam in 3 Monaten. ${t.name} wird die Erhöhung zur Kenntnis nehmen – die Zufriedenheit sinkt vorübergehend.`} confirmLabel="Ankündigen" onConfirm={() => dispatch({ type: 'rentIncrease', contractId: c.id, newRent, kind })} />
      <Confirm open={confirm === 'terminate'} onOpenChange={(v) => !v && setConfirm(null)} danger title="Fristlose Kündigung?" text={`${t.name} wird wegen ${formatMoney(arrears)} Rückstand gekündigt. Anwaltskosten ${formatMoney(CONFIG.dunning.legalCost)}. Diese Aktion kann nicht rückgängig gemacht werden.`} confirmLabel="Kündigen" onConfirm={() => dispatch({ type: 'terminateArrears', contractId: c.id })} />
      <Confirm open={confirm === 'mutual'} onOpenChange={(v) => !v && setConfirm(null)} title="Aufhebungsvertrag anbieten?" text={`Sie bieten ${t.name} ${formatMoney(comp)} für einen Auszug in ca. zwei Monaten. Lehnt der Mieter ab, ist er verärgert. Bei Annahme wird die Abfindung sofort fällig.`} confirmLabel="Angebot machen" onConfirm={() => dispatch({ type: 'mutualTermination', contractId: c.id, compensation: comp })} />
    </div>
  );
}

function ClaimsTable({ claims, compact }: { claims: Claim[]; compact?: boolean }) {
  const s = useGs();
  const dispatch = useDispatch();
  const [wo, setWo] = React.useState<Claim | null>(null);
  return (
    <Card>
      <CardHeader title={compact ? 'Forderungen dieses Vertrags' : 'Offene Forderungen'} subtitle={compact ? undefined : `Mahnstufen: ${DUNNING_LABEL.slice(1).join(' → ')} (Anwalt: ${formatMoney(CONFIG.dunning.legalCost)})`} />
      <DataTable
        rows={claims}
        rowKey={(x) => x.id}
        pageSize={compact ? undefined : 20}
        empty="Keine offenen Forderungen."
        initialSort={{ key: 'due', dir: 1 }}
        columns={[
          { key: 'p', header: 'Periode', cell: (x) => <span>{x.period}{x.note && <span className="block text-[10px] text-muted-fg">{x.note}</span>}</span> },
          ...(compact ? [] : [{ key: 't', header: 'Mieter', cell: (x: Claim) => { const t = s.tenants.find((y) => y.id === x.tenantId); return <span>{t?.name}{t?.status === 'former' && <span className="text-xs text-muted-fg"> (ausgezogen)</span>}</span>; } }]),
          { key: 'due', header: 'Fällig', cell: (x) => <span className={x.dueDay < s.day && x.status !== 'paid' ? 'text-danger' : ''}>{formatDate(x.dueDay)}</span>, sort: (x) => x.dueDay },
          { key: 'a', header: 'Betrag', align: 'right', cell: (x) => <Money cents={x.amount} /> },
          { key: 'o', header: 'Offen', align: 'right', cell: (x) => (x.status === 'paid' ? <span className="text-success">bezahlt</span> : x.status === 'written_off' ? <span className="text-muted-fg">ausgebucht</span> : <Money cents={claimOutstanding(x)} />), sort: (x) => claimOutstanding(x) },
          { key: 'd', header: 'Mahnstufe', cell: (x) => (x.dunningLevel ? <Badge tone={x.dunningLevel >= 3 ? 'danger' : 'warning'}>{DUNNING_LABEL[x.dunningLevel]}</Badge> : <span className="text-xs text-muted-fg">–</span>) },
          {
            key: 'act',
            header: '',
            align: 'right',
            cell: (x) => {
              if (x.status !== 'open' && x.status !== 'partial') return null;
              const d = canDun(s, x);
              return (
                <span className="flex justify-end gap-1">
                  <Tip content={d.ok ? `${DUNNING_LABEL[d.nextLevel]} senden` : d.reason}>
                    <span>
                      <Button size="sm" variant="outline" disabled={!d.ok} onClick={() => dispatch({ type: 'dun', claimId: x.id })}>
                        {d.nextLevel <= 3 ? DUNNING_LABEL[Math.min(3, d.nextLevel)] : 'Mahnen'}
                      </Button>
                    </span>
                  </Tip>
                  {x.dueDay < s.day - 60 && (
                    <Button size="sm" variant="ghost" onClick={() => setWo(x)}>
                      Ausbuchen
                    </Button>
                  )}
                </span>
              );
            },
          },
        ]}
      />
      <Confirm open={!!wo} onOpenChange={(v) => !v && setWo(null)} danger title="Forderung ausbuchen?" text={wo ? `Die Restforderung von ${formatMoney(claimOutstanding(wo))} wird als uneinbringlich ausgebucht. Der Mieter muss sie dann nicht mehr zahlen.` : ''} confirmLabel="Ausbuchen" onConfirm={() => wo && dispatch({ type: 'writeOff', claimId: wo.id })} />
    </Card>
  );
}
