import * as React from 'react';
import { Lock, Paintbrush } from 'lucide-react';
import { useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, Select, Tabs } from '@/components/ui';
import { CATEGORY_LABEL, MEASURES, MEASURE_BY_ID, type MeasureCategory, type MeasureDef } from '@/content/measures';
import { TRADE_LABEL } from '@/content/components';
import { activeSubsidyRate, type JobRequest } from '@/game/jobs';
import { materialIndex } from '@/game/derived';
import { JobDialog } from '@/features/jobs/JobDialog';
import { STATUS_LABEL } from '@/features/common';
import { formatMoney, mulCents } from '@/utils/money';
import { cn } from '@/utils/misc';
import { formatDate } from '@/utils/date';
import { GfxImage } from '@/features/graphics/Gfx';

export function RenovationPage() {
  const s = useGs();
  const { focusId } = useUi();
  const initialApt = s.apartments.find((a) => a.id === focusId)?.id ?? s.apartments.find((a) => a.status === 'vacant_needs_renovation')?.id ?? s.apartments[0].id;
  const [scope, setScope] = React.useState<'apartment' | 'building'>(focusId && MEASURE_BY_ID[focusId]?.scope === 'building' ? 'building' : 'apartment');
  const [aptId, setAptId] = React.useState(initialApt);
  const [cat, setCat] = React.useState<'all' | MeasureCategory>('all');
  const [req, setReq] = React.useState<JobRequest | null>(null);
  React.useEffect(() => {
    if (focusId && MEASURE_BY_ID[focusId]) {
      const m = MEASURE_BY_ID[focusId];
      setScope(m.scope);
      setReq({ kind: 'measure', measureId: m.id, apartmentId: m.scope === 'apartment' ? aptId : undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);
  const apt = s.apartments.find((a) => a.id === aptId)!;
  const list = MEASURES.filter((m) => m.scope === scope && (cat === 'all' || m.category === cat));
  const subsidy = activeSubsidyRate(s);
  const active = s.jobs.filter((j) => (j.kind === 'renovation' || j.kind === 'modernization') && (j.status === 'scheduled' || j.status === 'in_progress'));
  const unlocked = (m: MeasureDef) => s.phase >= m.unlockPhase || s.unlocks.includes('all');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={scope} onChange={setScope} items={[{ id: 'apartment', label: 'Wohnungen' }, { id: 'building', label: 'Gebäude & Energie' }]} />
        {scope === 'apartment' && (
          <Select
            className="h-9 w-72"
            value={aptId}
            onChange={setAptId}
            aria-label="Wohnung wählen"
            options={s.apartments.map((a) => ({ value: a.id, label: `Whg. ${a.number} – ${STATUS_LABEL[a.status]} (${Math.round(a.condition)} %)` }))}
          />
        )}
        <Tabs className="ml-auto" value={cat} onChange={setCat} items={[{ id: 'all', label: 'Alle' }, ...(Object.keys(CATEGORY_LABEL) as MeasureCategory[]).map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))]} />
      </div>
      {subsidy > 0 && <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success">Förderprogramm aktiv: {Math.round(subsidy * 100)} % Zuschuss auf förderfähige Energiemaßnahmen.</div>}
      {active.length > 0 && (
        <Card>
          <CardHeader title="Laufende Maßnahmen" />
          <CardBody className="flex flex-wrap gap-2">
            {active.map((j) => (
              <Badge key={j.id} tone="primary">
                {j.title} · {j.status === 'scheduled' ? `ab ${formatDate(j.startDay)}` : `${j.workedDays}/${j.estimatedDays} T.`}
              </Badge>
            ))}
          </CardBody>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => {
          const a = m.scope === 'apartment' ? apt : undefined;
          const ok = unlocked(m);
          const reason = !ok ? `Freischaltung in Phase ${m.unlockPhase}` : m.requiresVacant && a?.tenantId ? 'Nur in leerstehenden Wohnungen möglich.' : m.unavailable(s, a);
          const cost = mulCents(m.baseCost(s, a), materialIndex(s));
          const running = s.jobs.some((j) => j.measureId === m.id && (j.status === 'scheduled' || j.status === 'in_progress') && (m.scope === 'building' || (j.target.kind === 'apartment' && j.target.apartmentId === a?.id)));
          return (
            <Card key={m.id} className={cn('flex flex-col overflow-hidden', !ok && 'opacity-60')}>
              <GfxImage id={`measure.${m.id}`} className="aspect-[2/1] w-full object-cover" />
              <CardHeader title={m.label} subtitle={`${CATEGORY_LABEL[m.category]} · ${TRADE_LABEL[m.trade]}`} icon={ok ? <Paintbrush size={15} /> : <Lock size={15} />} actions={m.subsidyEligible && <Badge tone="success">förderfähig</Badge>} />
              <CardBody className="flex flex-1 flex-col gap-3">
                <p className="text-sm text-muted-fg">{m.description}</p>
                <ul className="space-y-0.5 text-xs">
                  {m.effects.map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="text-xs text-muted-fg">
                    <div className="num text-base font-bold text-fg">ab ≈ {formatMoney(Math.round(cost * 0.85), { decimals: false })}</div>
                    ca. {m.days(s, a)} Tage{m.noise >= 2 ? ' · laut' : ''}
                    {m.blocksApartment ? ' · Whg. gesperrt' : ''}
                  </div>
                  <Button size="sm" disabled={!!reason || running} onClick={() => setReq({ kind: 'measure', measureId: m.id, apartmentId: a?.id })}>
                    {running ? 'Beauftragt' : 'Prognose & Angebote'}
                  </Button>
                </div>
                {reason && !running && <p className="text-xs text-warning">{reason}</p>}
              </CardBody>
            </Card>
          );
        })}
      </div>
      <JobDialog request={req} open={!!req} onOpenChange={(v) => !v && setReq(null)} />
    </div>
  );
}
