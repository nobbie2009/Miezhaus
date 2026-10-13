import * as React from 'react';
import { Building2, History, Sparkles, Wrench } from 'lucide-react';
import type { ComponentKey } from '@/domain/schema';
import { useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, KeyValue, Meter, Progress, Tabs, Tip } from '@/components/ui';
import { BuildingView } from '@/features/building/BuildingView';
import { COMPONENTS, COMPONENT_ORDER } from '@/content/components';
import { DEFECT_TYPES } from '@/content/defects';
import { AMENITY_LABEL } from '@/content/measures';
import { CONFIG } from '@/game/config';
import { backlogCost, buildingAttractiveness, buildingCondition, energyClass, marketValue, specificEnergyDemand, totalArea } from '@/game/derived';
import type { JobRequest } from '@/game/jobs';
import { JobDialog } from '@/features/jobs/JobDialog';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { Money, SEVERITY_TEXT, SEVERITY_TONE } from '@/features/common';
import { GfxImage } from '@/features/graphics/Gfx';

const RENEWAL: Partial<Record<ComponentKey, string>> = {
  roof: 'roof_renovation',
  facade: 'facade_renewal',
  windows: 'windows_replace',
  heating: 'heating_condensing',
  pipes: 'pipe_renewal',
  sanitary: 'pipe_renewal',
  electrical: 'electrical_renewal',
  stairwell: 'stairwell_upgrade',
  basement: 'basement_seal',
  outdoor: 'outdoor_design',
};

export function BuildingPage() {
  const s = useGs();
  const navigate = useUi((x) => x.navigate);
  const [sel, setSel] = React.useState<ComponentKey>('heating');
  const [req, setReq] = React.useState<JobRequest | null>(null);
  const [tab, setTab] = React.useState<'repairs' | 'modern'>('repairs');
  const b = s.building;
  const c = b.components[sel]!;
  const meta = COMPONENTS[sel];
  const defects = s.defects.filter((d) => d.resolvedDay === null && d.discovered && d.target.kind === 'component' && d.target.key === sel);
  const maintenanceActive = s.jobs.some((j) => j.kind === 'maintenance' && j.target.kind === 'component' && j.target.key === sel && (j.status === 'scheduled' || j.status === 'in_progress'));
  const age = new Date(s.day * 86400000).getUTCFullYear() - c.installedYear;
  const renewal = RENEWAL[sel];

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={`${b.name} – Gesamtansicht`} subtitle="Klicken Sie auf Bauteile (Dach, Fassade, Keller, Heizung …) oder Wohnungen" icon={<Building2 size={16} />} />
          <CardBody className="p-2 sm:p-4">
            <BuildingView s={s} className="mx-auto w-full text-fg" onSelectComponent={setSel} onSelectApartment={(id) => navigate('apartments', id)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={meta.label} subtitle={meta.description} icon={<Wrench size={16} />} />
          <CardBody className="space-y-4">
            <Meter label="Zustand" value={c.condition} hint="Unter 55 % steigt die Schadenswahrscheinlichkeit deutlich, unter 30 % drohen schwere Schäden." />
            <KeyValue
              items={[
                ['Qualitätsstufe', `${c.tier} / 5`],
                ['Eingebaut / Alter', `${c.installedYear} (${age} J.)`],
                ['Orientierung Lebensdauer', `${meta.lifespan} Jahre`],
                ['Letzte Wartung', c.lastMaintenanceDay ? formatDate(c.lastMaintenanceDay) : 'unbekannt'],
                ['Verschleißbremse', c.lastMaintenanceDay && s.day - c.lastMaintenanceDay < 365 ? 'aktiv (−45 %)' : 'inaktiv'],
                ['Erneuerung zuletzt', c.lastRenewalDay ? formatDate(c.lastRenewalDay) : '–'],
                ...(sel === 'heating' ? ([['Anlage', CONFIG.energy.heating[b.heatingSystem].label]] as [string, string][]) : []),
              ]}
            />
            {defects.length > 0 && (
              <div className="space-y-1.5">
                <div className="label">Offene Schäden</div>
                {defects.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span>
                      <Badge tone={SEVERITY_TONE[d.severity]}>{SEVERITY_TEXT[d.severity]}</Badge> {DEFECT_TYPES[d.type].label}
                    </span>
                    {d.jobId ? <Badge tone="primary">beauftragt</Badge> : <Button size="sm" onClick={() => setReq({ kind: 'repair', defectId: d.id })}>Reparieren</Button>}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Tip content={`${meta.maintenanceLabel} – ca. ${formatMoney(meta.maintenanceCost, { decimals: false })}`}>
                <span>
                  <Button variant="outline" disabled={maintenanceActive} onClick={() => setReq({ kind: 'maintenance', component: sel })}>
                    {maintenanceActive ? 'Wartung beauftragt' : 'Wartung beauftragen'}
                  </Button>
                </span>
              </Tip>
              {renewal && (
                <Button variant="secondary" onClick={() => navigate('renovation', renewal)}>
                  Erneuerung planen
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Gebäudekomponenten" subtitle="Bauteile altern unabhängig voneinander" />
          <CardBody className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {COMPONENT_ORDER.map((k) => {
              const cc = b.components[k]!;
              const n = s.defects.filter((d) => d.resolvedDay === null && d.discovered && d.target.kind === 'component' && d.target.key === k).length;
              return (
                <button key={k} onClick={() => setSel(k)} className={`rounded-lg p-2 text-left transition hover:bg-muted ${sel === k ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <GfxImage id={`component.${k}`} className="h-6 w-6 object-contain" />
                      {COMPONENTS[k].label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {n > 0 && <Badge tone="warning">{n} Schaden</Badge>}
                      <span className="num text-xs font-semibold">{Math.round(cc.condition)} %</span>
                    </span>
                  </div>
                  <Progress value={cc.condition} />
                </button>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Gebäudedaten" />
          <CardBody>
            <KeyValue
              items={[
                ['Adresse', `${b.address}, ${b.city}`],
                ['Baujahr', b.yearBuilt],
                ['Gebäudeklasse', <span key="k" className="text-xs">{b.buildingClass}</span>],
                ['Wohnfläche', `${totalArea(s).toLocaleString('de-DE')} m²`],
                ['Wohnungen', s.apartments.length],
                ['Grundstückswert', <Money key="l" cents={b.landValue} decimals={false} />],
                ['Marktwert (geschätzt)', <Money key="m" cents={marketValue(s)} decimals={false} />],
                ['Gesamtzustand', `${Math.round(buildingCondition(s))} %`],
                ['Instandhaltungsrückstand', <Money key="b" cents={backlogCost(s)} decimals={false} />],
                ['Energieeffizienz', `${energyClass(s).label} (${Math.round(specificEnergyDemand(s))} kWh/m²a)`],
                ['Dämmstufe', `${b.insulationLevel} / 3`],
              ]}
            />
            <div className="mt-4 space-y-2.5">
              <Meter label="Optische Attraktivität" value={buildingAttractiveness(s)} hint="Fassade, Treppenhaus, Außenbereich, Sauberkeit und Ausstattung." />
              <Meter label="Sauberkeit Treppenhaus" value={b.cleanliness} hint="Hängt von Reinigungsdienst, Hausmeister und Ordnungsliebe der Mieter ab." />
              <Meter label="Pflege Außenbereich" value={b.outdoorCare} hint="Gartenpflege und Hausmeister halten den Hof in Ordnung." />
              <Meter label="Brandschutz" value={b.fireSafety} />
              <Meter label="Sicherheit" value={b.security} />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Ausstattung" icon={<Sparkles size={16} />} />
          <CardBody className="flex flex-wrap gap-2">
            {b.amenities.length === 0 && <p className="text-sm text-muted-fg">Noch keine besondere Ausstattung.</p>}
            {b.amenities.map((a) => (
              <Badge key={a} tone="success">
                {AMENITY_LABEL[a] ?? a}
              </Badge>
            ))}
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Historie" icon={<History size={16} />} actions={<Tabs value={tab} onChange={setTab} items={[{ id: 'repairs', label: 'Reparaturen & Wartung' }, { id: 'modern', label: 'Modernisierungen' }]} />} />
          <DataTable
            rows={[...(tab === 'repairs' ? b.repairHistory : b.modernizationHistory)].reverse()}
            rowKey={(r) => `${r.day}-${r.text}-${r.cost}`}
            pageSize={8}
            empty="Noch keine Einträge."
            columns={[
              { key: 'd', header: 'Datum', cell: (r) => formatDate(r.day), sort: (r) => r.day },
              { key: 't', header: 'Maßnahme', cell: (r) => r.text },
              { key: 'z', header: 'Ziel', cell: (r) => <span className="text-muted-fg">{r.target}</span> },
              { key: 'c', header: 'Kosten', align: 'right', cell: (r) => <Money cents={r.cost} decimals={false} />, sort: (r) => r.cost },
            ]}
          />
        </Card>
      </div>
      <JobDialog request={req} open={!!req} onOpenChange={(v) => !v && setReq(null)} />
    </div>
  );
}
