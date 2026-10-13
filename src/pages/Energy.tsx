import * as React from 'react';
import { Flame, Leaf, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { useGs } from '@/hooks/useGameState';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, KeyValue, Stat } from '@/components/ui';
import { ENERGY_CLASSES, energyClass, energyPrice, heatLossCoefficient, heatPricePerKwh, heatingEfficiency, specificEnergyDemand, totalArea } from '@/game/derived';
import { annualEnergyCostEstimate } from '@/game/energy';
import { forecastMeasure } from '@/game/forecast';
import { MEASURES } from '@/content/measures';
import { CONFIG } from '@/game/config';
import { JobDialog } from '@/features/jobs/JobDialog';
import type { JobRequest } from '@/game/jobs';
import { formatPeriod } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { Money } from '@/features/common';

const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

export function EnergyPage() {
  const s = useGs();
  const [req, setReq] = React.useState<JobRequest | null>(null);
  const demand = specificEnergyDemand(s);
  const cls = energyClass(s);
  const est = annualEnergyCostEstimate(s);
  const start = s.counters.startEnergyDemand ?? demand;
  const hist = s.energyHistory.slice(-24).map((e) => ({ p: formatPeriod(e.period), Heizung: Math.round(e.heatKwh), Warmwasser: Math.round(e.hotWaterKwh), Allgemeinstrom: Math.round(e.commonKwh), Kosten: Math.round(e.cost / 100), Gradtage: Math.round(e.degreeDays) }));
  const savings = React.useMemo(
    () =>
      MEASURES.filter((m) => m.category === 'energy' && m.scope === 'building' && (s.phase >= m.unlockPhase || s.unlocks.includes('all')))
        .map((m) => ({ m, f: forecastMeasure(s, { kind: 'measure', measureId: m.id }) }))
        .filter((x) => !('error' in x.f))
        .map((x) => ({ m: x.m, f: x.f as Exclude<typeof x.f, { error: string }> }))
        .sort((a, b) => b.f.annualEnergySaving - a.f.annualEnergySaving),
    [s],
  );
  return (
    <div className="min-w-0 space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Effizienzklasse" value={cls.label} sub={`${Math.round(demand)} kWh/m²a Endenergie`} tone={['A+', 'A', 'B', 'C'].includes(cls.label) ? 'success' : ['D', 'E'].includes(cls.label) ? 'warning' : 'danger'} hint="Wetterunabhängiger Kennwert unter Standardklima (2.750 Kd), vergleichbar mit einem Bedarfsausweis." />
        <Stat label="Veränderung seit Start" value={`${Math.round(((demand - start) / start) * 100)} %`} tone={demand < start ? 'success' : undefined} sub={`Start: ${Math.round(start)} kWh/m²a`} />
        <Stat label="Energiekosten / Jahr (Schätzung)" value={formatMoney(est.heating + est.electricity, { decimals: false })} sub={`${formatMoney(Math.round((est.heating + est.electricity) / totalArea(s) / 12))} je m² und Monat`} hint="Umlagefähig – wird über die Nebenkosten von den Mietern getragen, außer für leere Wohnungen." />
        <Stat label="Energiepreisindex" value={energyPrice(s).toLocaleString('de-DE', { maximumFractionDigits: 2 })} sub={s.market.modifiers.filter((m) => m.kind === 'energy').map((m) => m.label).join(', ') || 'Marktpreis'} tone={energyPrice(s) > 1.2 ? 'warning' : undefined} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Verbrauch je Monat (kWh)" icon={<Flame size={16} />} subtitle="Heizwärme hängt von Außentemperatur, Gebäudehülle und Mieterverhalten ab" />
          <CardBody>
            {hist.length ? (
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={hist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="p" tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} width={52} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Heizung" stackId="a" fill="hsl(var(--danger))" />
                    <Bar dataKey="Warmwasser" stackId="a" fill="hsl(var(--warning))" />
                    <Bar dataKey="Allgemeinstrom" stackId="a" fill="hsl(var(--info))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-fg">Daten nach dem ersten Monatsabschluss.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Anlage & Gebäudehülle" icon={<Zap size={16} />} />
          <CardBody>
            <KeyValue
              items={[
                ['Heizung', CONFIG.energy.heating[s.building.heatingSystem].label],
                ['Wirkungsgrad / JAZ', heatingEfficiency(s).toLocaleString('de-DE', { maximumFractionDigits: 2 })],
                ['Wärmepreis', `${(heatPricePerKwh(s) / 100).toLocaleString('de-DE', { maximumFractionDigits: 3 })} €/kWh`],
                ['Dämmstufe', `${s.building.insulationLevel} / 3`],
                ['Fenster', `Stufe ${s.building.components.windows!.tier}, ${Math.round(s.building.components.windows!.condition)} %`],
                ['Wärmeverlust', `${heatLossCoefficient(s).toLocaleString('de-DE', { maximumFractionDigits: 4 })} kWh/m²Kd`],
                ['Smarte Thermostate', `${s.apartments.filter((a) => a.smartThermostat).length} von ${s.apartments.length} Whg.`],
                ['Hydraulischer Abgleich', s.building.amenities.includes('hydraulic_balancing') ? 'ja' : 'nein'],
                ['Photovoltaik', s.building.amenities.includes('solar') ? `${CONFIG.energy.pvKwp} kWp` : 'nein'],
              ]}
            />
            <div className="mt-4 flex h-6 overflow-hidden rounded-md text-[10px] font-bold text-white">
              {ENERGY_CLASSES.map((c, i) => (
                <div key={c.label} className={cn('flex flex-1 items-center justify-center', c.label === cls.label && 'ring-2 ring-fg ring-offset-1')} style={{ background: `hsl(${120 - i * 15} 70% ${42 + (i % 2) * 3}%)` }}>
                  {c.label}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Energiekosten & Heizgradtage" />
          <CardBody>
            {hist.length ? (
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={hist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="p" tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} width={48} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }} width={36} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="l" dataKey="Kosten" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Kosten (€)" />
                    <Line yAxisId="r" dataKey="Gradtage" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-fg">Noch keine Daten.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Einsparpotenziale" icon={<Leaf size={16} />} subtitle="Prognose auf Basis des aktuellen Gebäudezustands" />
          <DataTable
            rows={savings}
            rowKey={(x) => x.m.id}
            empty="Keine weiteren Maßnahmen verfügbar."
            columns={[
              { key: 'm', header: 'Maßnahme', cell: (x) => <span className="text-sm font-medium">{x.m.label}</span> },
              { key: 's', header: 'Ersparnis/Jahr', align: 'right', cell: (x) => <Money cents={x.f.annualEnergySaving} decimals={false} className="text-success" />, sort: (x) => x.f.annualEnergySaving },
              { key: 'c', header: 'Kosten', align: 'right', cell: (x) => <Money cents={x.f.costEstimate} decimals={false} />, sort: (x) => x.f.costEstimate },
              { key: 'k', header: 'Klasse', cell: (x) => <Badge tone="success">{x.f.before.energyClass}→{x.f.after.energyClass}</Badge> },
              { key: 'a', header: '', align: 'right', cell: (x) => <Button size="sm" variant="outline" onClick={() => setReq({ kind: 'measure', measureId: x.m.id })}>Details</Button> },
            ]}
          />
        </Card>
      </div>
      <JobDialog request={req} open={!!req} onOpenChange={(v) => !v && setReq(null)} />
    </div>
  );
}
