import * as React from 'react';
import { ClipboardList, HardHat, Wrench, XCircle } from 'lucide-react';
import type { ComponentKey, Job } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { useGame } from '@/store/gameStore';
import { STRATEGY_LABEL, automationChannel } from '@/game/automation';
import { Badge, Button, Card, CardBody, CardHeader, Confirm, DataTable, Progress, Tabs, Tip } from '@/components/ui';
import { DEFECT_TYPES } from '@/content/defects';
import { COMPONENTS, COMPONENT_ORDER } from '@/content/components';
import { targetLabel } from '@/game/defects';
import { contractorName, type JobRequest } from '@/game/jobs';
import { JobDialog } from '@/features/jobs/JobDialog';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { JOB_STATUS_LABEL, Money, SEVERITY_TEXT, SEVERITY_TONE, URGENCY_LABEL, URGENCY_TONE } from '@/features/common';

export function RepairsPage() {
  const s = useGs();
  const dispatch = useDispatch();
  const { focusId } = useUi();
  const [tab, setTab] = React.useState<'open' | 'jobs' | 'maintenance' | 'done'>('open');
  const [req, setReq] = React.useState<JobRequest | null>(null);
  const [cancel, setCancel] = React.useState<Job | null>(null);
  const [sev, setSev] = React.useState<'all' | '2' | '3'>('all');
  React.useEffect(() => {
    if (!focusId) return;
    const d = s.defects.find((x) => x.id === focusId);
    if (d && !d.jobId && d.resolvedDay === null && d.discovered) setReq({ kind: 'repair', defectId: d.id });
    if (s.jobs.some((j) => j.id === focusId)) setTab('jobs');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);
  const open = s.defects.filter((d) => d.resolvedDay === null && d.discovered && (sev === 'all' || d.severity >= Number(sev)));
  const active = s.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');
  const done = s.jobs.filter((j) => j.status === 'done' || j.status === 'cancelled').reverse();
  const busy = useGame((x) => x.busy);
  const unassigned = open.filter((d) => !d.jobId || !active.some((j) => j.id === d.jobId)).length;

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'open', label: 'Offene Schäden', badge: <Badge tone="warning">{s.defects.filter((d) => d.resolvedDay === null && d.discovered && !d.jobId).length}</Badge> },
          { id: 'jobs', label: 'Aktive Aufträge', badge: <Badge tone="primary">{active.length}</Badge> },
          { id: 'maintenance', label: 'Wartung' },
          { id: 'done', label: 'Abgeschlossen' },
        ]}
      />
      {tab === 'open' && (
        <Card>
          <CardHeader title="Gemeldete & entdeckte Schäden" icon={<Wrench size={16} />} subtitle="Unentdeckte Mängel erscheinen erst nach Meldung, Wartung oder Inspektion" actions={
              <div className="flex flex-wrap items-center gap-2">
                <Tabs value={sev} onChange={setSev} items={[{ id: 'all', label: 'Alle' }, { id: '2', label: 'Erheblich+' }, { id: '3', label: 'Kritisch' }]} />
                <Tip content={`Vergibt für jeden offenen Schaden einen Auftrag nach Ihrer Strategie „${STRATEGY_LABEL[s.automation.strategy]}“ (änderbar unter Personal & Dienstleister).`}>
                  <Button size="sm" disabled={busy || unassigned === 0} onClick={() => dispatch({ type: 'repairAll', minSeverity: sev === 'all' ? undefined : Number(sev) })} data-testid="repair-all">
                    <HardHat size={14} /> Alle beauftragen ({unassigned})
                  </Button>
                </Tip>
              </div>
            }
          />
          {!automationChannel(s) && (
            <div className="mx-4 mb-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs">
              Tipp: Mit der <strong>Mieter-App</strong> (Personal & Dienstleister) melden Mieter Schäden per Foto und beauftragen Handwerker nach Ihren Regeln selbst – Sie müssen sich nur noch um größere Aufträge kümmern.
            </div>
          )}
          <DataTable
            rows={open}
            rowKey={(d) => d.id}
            initialSort={{ key: 'sev', dir: -1 }}
            empty="Keine bekannten Schäden. Sehr gut!"
            columns={[
              { key: 'sev', header: 'Schwere', cell: (d) => <Badge tone={SEVERITY_TONE[d.severity]}>{SEVERITY_TEXT[d.severity]}</Badge>, sort: (d) => d.severity * 1000 - (d.discoveredDay ?? 0) / 100 },
              { key: 'type', header: 'Schaden', cell: (d) => <div><div className="font-medium">{DEFECT_TYPES[d.type].label}</div><div className="max-w-sm truncate text-xs text-muted-fg">{d.cause}</div></div>, sort: (d) => DEFECT_TYPES[d.type].label },
              { key: 'where', header: 'Ort', cell: (d) => targetLabel(s, d.target), sort: (d) => targetLabel(s, d.target) },
              { key: 'since', header: 'Seit', cell: (d) => <span className="num text-xs">{formatDate(d.discoveredDay ?? d.createdDay)}</span>, sort: (d) => d.discoveredDay ?? 0 },
              {
                key: 'esc',
                header: 'Folgeschaden',
                cell: (d) => {
                  const def = DEFECT_TYPES[d.type];
                  if (!def.escalation || d.escalateAtDay === null) return <span className="text-xs text-muted-fg">–</span>;
                  const left = d.escalateAtDay - s.day;
                  return (
                    <Tip content={`Ohne Reparatur: ${DEFECT_TYPES[def.escalation.to].label}`}>
                      <span className={cn('text-xs font-medium', left <= 14 ? 'text-danger' : 'text-warning')}>{d.jobId ? 'gestoppt' : `in ~${Math.max(0, left)} T.`}</span>
                    </Tip>
                  );
                },
                sort: (d) => d.escalateAtDay ?? 99999,
              },
              { key: 'cost', header: 'Richtpreis', align: 'right', cell: (d) => <Money cents={DEFECT_TYPES[d.type].repairCost} decimals={false} />, sort: (d) => DEFECT_TYPES[d.type].repairCost },
              { key: 'a', header: '', align: 'right', cell: (d) => (d.jobId ? <Badge tone="primary">beauftragt</Badge> : <Button size="sm" onClick={() => setReq({ kind: 'repair', defectId: d.id })}>Angebote</Button>) },
            ]}
          />
        </Card>
      )}
      {tab === 'jobs' && (
        <Card>
          <CardHeader title="Aktive Aufträge" icon={<HardHat size={16} />} />
          <CardBody className="space-y-3">
            {!active.length && <p className="text-sm text-muted-fg">Keine aktiven Aufträge.</p>}
            {active.map((j) => (
              <div key={j.id} className={cn('rounded-xl border p-3', focusId === j.id ? 'border-primary' : 'border-border')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {j.title}
                      <Badge tone={URGENCY_TONE[j.urgency]}>{URGENCY_LABEL[j.urgency]}</Badge>
                      <Badge tone={j.status === 'in_progress' ? 'primary' : 'neutral'}>{JOB_STATUS_LABEL[j.status]}</Badge>
                    </div>
                    <div className="text-xs text-muted-fg">
                      {contractorName(s, j.contractorId)} · {targetLabel(s, j.target)} · Angebot {formatMoney(j.estimatedCost, { decimals: false })} (±{Math.round(j.uncertainty * 100)} %)
                      {j.paid > 0 && ` · bereits gezahlt ${formatMoney(j.paid, { decimals: false })}`}
                      {j.delays > 0 && ` · ${j.delays} Tag(e) Verzug`}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setCancel(j)}>
                    <XCircle size={13} /> Stornieren
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={(j.workedDays / j.estimatedDays) * 100} tone="primary" />
                  <span className="num shrink-0 text-xs text-muted-fg">{j.status === 'scheduled' ? `Start ${formatDate(j.startDay)}` : `${j.workedDays} von ${j.estimatedDays} Tagen`}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
      {tab === 'maintenance' && (
        <Card>
          <CardHeader title="Vorbeugende Wartung" icon={<ClipboardList size={16} />} subtitle="Eine Wartung verbessert den Zustand, entdeckt versteckte Mängel und bremst den Verschleiß 12 Monate lang um 45 %" />
          <DataTable
            rows={COMPONENT_ORDER}
            rowKey={(k) => k}
            columns={[
              { key: 'c', header: 'Bauteil', cell: (k) => <span className="font-medium">{COMPONENTS[k].label}</span> },
              { key: 'm', header: 'Maßnahme', cell: (k) => <span className="text-xs">{COMPONENTS[k].maintenanceLabel}</span> },
              { key: 'z', header: 'Zustand', align: 'right', cell: (k) => `${Math.round(s.building.components[k]!.condition)} %`, sort: (k) => s.building.components[k]!.condition },
              { key: 'l', header: 'Zuletzt', cell: (k) => { const d = s.building.components[k]!.lastMaintenanceDay; return <span className={cn('text-xs', !d || s.day - d > 365 ? 'text-warning' : 'text-muted-fg')}>{d ? formatDate(d) : 'nie'}</span>; } },
              { key: 'p', header: 'Richtpreis', align: 'right', cell: (k) => <Money cents={COMPONENTS[k].maintenanceCost} decimals={false} /> },
              { key: 'a', header: '', align: 'right', cell: (k: ComponentKey) => { const busy = s.jobs.some((j) => j.kind === 'maintenance' && j.target.kind === 'component' && j.target.key === k && (j.status === 'scheduled' || j.status === 'in_progress')); return <Button size="sm" variant="outline" disabled={busy} onClick={() => setReq({ kind: 'maintenance', component: k })}>{busy ? 'beauftragt' : 'Beauftragen'}</Button>; } },
            ]}
          />
          {!s.services.maintenancePlan && <div className="border-t border-border px-4 py-3 text-xs text-muted-fg">Tipp: Ein Wartungsvertrag (Personal & Dienstleister) übernimmt die jährliche Wartung von Heizung, Elektrik, Leitungen, Sanitär und Dach automatisch.</div>}
        </Card>
      )}
      {tab === 'done' && (
        <Card>
          <CardHeader title="Abgeschlossene Aufträge" />
          <DataTable
            rows={done}
            rowKey={(j) => j.id}
            pageSize={15}
            empty="Noch keine abgeschlossenen Aufträge."
            columns={[
              { key: 'd', header: 'Abschluss', cell: (j) => formatDate(j.completedDay ?? j.createdDay), sort: (j) => j.completedDay ?? 0 },
              { key: 't', header: 'Auftrag', cell: (j) => j.title },
              { key: 'c', header: 'Betrieb', cell: (j) => <span className="text-xs">{contractorName(s, j.contractorId)}</span> },
              { key: 's', header: 'Status', cell: (j) => <Badge tone={j.status === 'done' ? 'success' : 'neutral'}>{JOB_STATUS_LABEL[j.status]}</Badge> },
              { key: 'e', header: 'Angebot', align: 'right', cell: (j) => <Money cents={j.estimatedCost} decimals={false} /> },
              { key: 'a', header: 'Tatsächlich', align: 'right', cell: (j) => (j.actualCost !== null ? <Money cents={j.actualCost} decimals={false} className={j.actualCost > j.estimatedCost * 1.1 ? 'text-danger' : ''} /> : <Money cents={j.paid} decimals={false} />), sort: (j) => j.actualCost ?? j.paid },
            ]}
          />
        </Card>
      )}
      <JobDialog request={req} open={!!req} onOpenChange={(v) => !v && setReq(null)} />
      <Confirm
        open={!!cancel}
        onOpenChange={(v) => !v && setCancel(null)}
        danger
        title="Auftrag stornieren?"
        text={cancel?.status === 'in_progress' ? `Die Arbeiten laufen bereits. Bereits erbrachte Leistungen (${cancel.workedDays}/${cancel.estimatedDays} Tage) plus 10 % Ausfallpauschale werden berechnet.` : 'Der Auftrag hat noch nicht begonnen und kann kostenlos storniert werden.'}
        confirmLabel="Stornieren"
        onConfirm={() => cancel && dispatch({ type: 'cancelJob', jobId: cancel.id })}
      />
    </div>
  );
}
