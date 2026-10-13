import * as React from 'react';
import { MessageSquare, PawPrint, Users } from 'lucide-react';
import type { Tenant, Traits } from '@/domain/schema';
import { useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Empty, KeyValue, Progress, Tabs, Tip } from '@/components/ui';
import { ARCHETYPE_BY_ID, NEED_LABEL, TRAIT_LABEL } from '@/content/tenants';
import { apartmentOf, computeSatisfaction, contractOfTenant, needSatisfied } from '@/game/tenants';
import { claimOutstanding } from '@/game/derived';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { Money, SatisfactionFace, satTone } from '@/features/common';

const FACTOR_HINT: Record<string, string> = {
  Miete: 'Verhältnis der Miete zur Vergleichsmiete, gewichtet mit der Sparsamkeit.',
  Wohnungszustand: 'Renovierungszustand der Wohnung im Verhältnis zu den Ansprüchen.',
  Ausstattung: 'Küche, Bad und Böden.',
  Sauberkeit: 'Treppenhaus und Außenbereich.',
  Mängel: 'Offene Schäden in der Wohnung und hausweite Probleme. Lange offene Mängel wiegen schwerer.',
  Baulärm: 'Laufende Arbeiten im Haus, gewichtet mit Lärmempfindlichkeit und Baustellentoleranz.',
  Heizkosten: 'Erwartete Heizkosten pro m² im Vergleich zu einem Richtwert.',
  Sicherheit: 'Brandschutz und Sicherheit des Hauses.',
  Bedürfnisse: 'Persönliche Wünsche (Balkon, Garten, Ruhe …).',
  Gemeinschaft: 'Gemeinschaftsflächen und Nachbarschaft.',
  Service: 'Hausmeister, Verwaltung, Reinigung.',
  Stimmung: 'Kurzfristige Ereignisse wie Reparaturen, Streit, Mieterhöhungen.',
};

export function TenantsPage() {
  const s = useGs();
  const { focusId } = useUi();
  const [tab, setTab] = React.useState<'active' | 'former'>('active');
  const list = s.tenants.filter((t) => (tab === 'active' ? t.status !== 'former' : t.status === 'former'));
  const [sel, setSel] = React.useState<string | null>(focusId ?? list[0]?.id ?? null);
  React.useEffect(() => {
    if (focusId && s.tenants.some((t) => t.id === focusId)) setSel(focusId);
  }, [focusId, s.tenants]);
  const t = s.tenants.find((x) => x.id === sel) ?? null;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader title="Mieter" icon={<Users size={16} />} actions={<Tabs value={tab} onChange={setTab} items={[{ id: 'active', label: 'Aktuell' }, { id: 'former', label: 'Ehemalige' }]} />} />
        <DataTable
          rows={list}
          rowKey={(t) => t.id}
          selectedKey={sel}
          onRowClick={(t) => setSel(t.id)}
          initialSort={{ key: 'sat', dir: 1 }}
          empty={tab === 'active' ? 'Keine Mieter.' : 'Noch keine ehemaligen Mieter.'}
          columns={[
            { key: 'name', header: 'Name', cell: (t) => <span className="flex items-center gap-1.5 font-medium"><SatisfactionFace value={t.satisfaction} />{t.name}</span>, sort: (t) => t.name },
            { key: 'apt', header: 'Whg.', cell: (t) => apartmentOf(s, t)?.number ?? '–', sort: (t) => apartmentOf(s, t)?.number ?? '' },
            { key: 'arch', header: 'Typ', cell: (t) => <span className="text-xs text-muted-fg">{ARCHETYPE_BY_ID[t.archetype]?.label}</span> },
            { key: 'sat', header: 'Zufriedenheit', align: 'right', cell: (t) => <span className={cn('font-semibold', satTone(t.satisfaction) === 'success' ? 'text-success' : satTone(t.satisfaction) === 'warning' ? 'text-warning' : 'text-danger')}>{Math.round(t.satisfaction)} %</span>, sort: (t) => t.satisfaction },
            { key: 'st', header: '', cell: (t) => (t.status === 'moving_out' ? <Badge tone="warning">zieht aus</Badge> : null) },
          ]}
        />
      </Card>
      {t ? <TenantDetail t={t} /> : <Card><Empty title="Kein Mieter gewählt" /></Card>}
    </div>
  );
}

function TenantDetail({ t }: { t: Tenant }) {
  const s = useGs();
  const navigate = useUi((x) => x.navigate);
  const a = apartmentOf(s, t);
  const c = contractOfTenant(s, t) ?? s.contracts.filter((x) => x.tenantId === t.id).slice(-1)[0];
  const res = t.status !== 'former' ? computeSatisfaction(s, t) : null;
  const factors = Object.entries(res?.factors ?? t.factors).sort((x, y) => x[1] - y[1]);
  const claims = s.claims.filter((x) => x.tenantId === t.id).sort((x, y) => y.dueDay - x.dueDay).slice(0, 12);
  const msgs = s.messages.filter((m) => m.tenantId === t.id).slice(-8).reverse();
  const arch = ARCHETYPE_BY_ID[t.archetype];
  return (
    <div className="min-w-0 space-y-5">
      <Card>
        <CardHeader
          title={t.name}
          subtitle={`${arch?.label ?? ''} · ${t.occupation} · ${t.householdSize} Person(en)`}
          actions={
            <span className="flex items-center gap-2">
              {t.pets && <Tip content="Haustiere"><PawPrint size={14} className="text-muted-fg" /></Tip>}
              <SatisfactionFace value={t.satisfaction} size={26} />
            </span>
          }
        />
        <CardBody className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-fg">Zufriedenheit</span>
                <span className="num font-semibold">
                  {Math.round(t.satisfaction)} %{res && <span className="font-normal text-muted-fg"> → Ziel {Math.round(res.target)} %</span>}
                </span>
              </div>
              <Progress value={t.satisfaction} tone={satTone(t.satisfaction)} />
            </div>
            <p className="text-xs leading-relaxed text-muted-fg">{arch?.description}</p>
            <KeyValue
              items={[
                ['Wohnung', a ? <button key="a" className="text-primary hover:underline" onClick={() => navigate('apartments', a.id)}>{a.number}</button> : '–'],
                ['Eingezogen', formatDate(t.moveInDay)],
                ['Einkommen (netto)', formatMoney(t.monthlyIncome, { decimals: false })],
                ['Bonität', `${t.creditScore} / 100`],
                ['Finanzielle Belastung', <span key="f" className={t.financialStress > 50 ? 'text-danger' : ''}>{Math.round(t.financialStress)} %</span>],
                ['Beschwerden / Dank', `${t.complaints} / ${t.thanks}`],
                ...(t.status === 'moving_out' && t.moveOutDay ? ([['Auszug', `${formatDate(t.moveOutDay)} (${t.moveOutReason ?? ''})`]] as [string, string][]) : []),
              ]}
            />
            {c && (
              <Button size="sm" variant="outline" onClick={() => navigate('contracts', c.id)}>
                Mietvertrag öffnen
              </Button>
            )}
          </div>
          <div>
            <div className="label mb-2">Was die Zufriedenheit bestimmt</div>
            <div className="space-y-1.5">
              {factors.map(([k, v]) => (
                <Tip key={k} content={FACTOR_HINT[k]}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-28 shrink-0 text-muted-fg">{k}</span>
                    <div className="relative h-2 flex-1 rounded-full bg-muted">
                      <div className="absolute left-1/2 top-0 h-2 w-px bg-border" />
                      <div className={cn('absolute top-0 h-2 rounded-full', v >= 0 ? 'left-1/2 bg-success' : 'right-1/2 bg-danger')} style={{ width: `${Math.min(50, Math.abs(v) * 2)}%` }} />
                    </div>
                    <span className={cn('num w-10 text-right font-semibold', v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-muted-fg')}>{v > 0 ? '+' : ''}{v.toFixed(1)}</span>
                  </div>
                </Tip>
              ))}
            </div>
            {t.moods.filter((m) => m.untilDay >= s.day).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {t.moods.filter((m) => m.untilDay >= s.day).map((m) => (
                  <Badge key={m.reason} tone={m.value >= 0 ? 'success' : 'danger'} title={`bis ${formatDate(m.untilDay)}`}>
                    {m.reason} {m.value > 0 ? '+' : ''}
                    {m.value}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader title="Persönlichkeit" />
          <CardBody className="space-y-2">
            {(Object.keys(TRAIT_LABEL) as (keyof Traits)[]).map((k) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-40 shrink-0 text-muted-fg">{TRAIT_LABEL[k]}</span>
                <Progress value={t.traits[k]} tone="primary" />
              </div>
            ))}
            <div className="pt-2">
              <div className="label mb-1">Bedürfnisse</div>
              <div className="flex flex-wrap gap-1">
                {t.needs.length === 0 && <span className="text-xs text-muted-fg">Keine besonderen Wünsche.</span>}
                {t.needs.map((n) => {
                  const v = a && t.status !== 'former' ? needSatisfied(s, t, a, n) : 0;
                  return (
                    <Badge key={n} tone={v > 0 ? 'success' : v < 0 ? 'danger' : 'neutral'}>
                      {NEED_LABEL[n]} {v > 0 ? '✓' : v < 0 ? '✗' : ''}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Zahlungen" subtitle={c ? `Miete ${formatMoney(c.netRent)} + NK ${formatMoney(c.utilityPrepayment)}` : undefined} />
          <DataTable
            rows={claims}
            rowKey={(x) => x.id}
            empty="Keine Forderungen."
            columns={[
              { key: 'p', header: 'Periode', cell: (x) => x.period },
              { key: 'a', header: 'Betrag', align: 'right', cell: (x) => <Money cents={x.amount} /> },
              { key: 'o', header: 'Offen', align: 'right', cell: (x) => (x.status === 'written_off' ? <span className="text-muted-fg">ausgebucht</span> : claimOutstanding(x) > 0 ? <Money cents={claimOutstanding(x)} className={x.dueDay < s.day ? 'text-danger' : ''} /> : <span className="text-success">bezahlt</span>) },
            ]}
          />
        </Card>
      </div>
      <Card>
        <CardHeader title="Kommunikation" icon={<MessageSquare size={16} />} />
        <CardBody className="space-y-2">
          {msgs.length === 0 && <p className="text-sm text-muted-fg">Keine Nachrichten.</p>}
          {msgs.map((m) => (
            <div key={m.id} className="rounded-lg bg-muted/60 p-3">
              <div className="flex justify-between gap-2 text-xs">
                <span className="font-semibold">{m.title}</span>
                <span className="text-muted-fg">{formatDate(m.day)}</span>
              </div>
              <p className="mt-1 text-sm">{m.text}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
