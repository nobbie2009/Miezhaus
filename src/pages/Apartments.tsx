import * as React from 'react';
import { CheckCircle2, DoorOpen, Eye, Megaphone, PawPrint, Search, ThumbsDown, ThumbsUp, UserPlus, Wrench, XCircle } from 'lucide-react';
import type { Apartment, Applicant } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { useGame } from '@/store/gameStore';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Empty, EuroInput, Field, KeyValue, Meter, Modal, Tabs, Tip } from '@/components/ui';
import { STATUS_LABEL, StatusBadge, Money, SatisfactionFace, SEVERITY_TEXT, SEVERITY_TONE } from '@/features/common';
import { applicantFit, maxNewLeaseRent } from '@/game/applicants';
import { comparableRent, contractOf, defectsOfApartment, floorLabel, tenantOf } from '@/game/derived';
import { DEFECT_TYPES } from '@/content/defects';
import { ARCHETYPE_BY_ID, NEED_LABEL } from '@/content/tenants';
import { LEVEL_LABEL } from '@/content/components';
import { CONFIG } from '@/game/config';
import { JobDialog } from '@/features/jobs/JobDialog';
import type { JobRequest } from '@/game/jobs';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';
import { apartmentHeatingCost } from '@/game/tenants';
import { Portrait } from '@/features/graphics/Gfx';

type Filter = 'all' | 'rented' | 'vacant' | 'work';

export function ApartmentsPage() {
  const s = useGs();
  const { focusId, navigate } = useUi();
  const [filter, setFilter] = React.useState<Filter>('all');
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState<string | null>(focusId ?? s.apartments.find((a) => a.status === 'vacant_ready')?.id ?? s.apartments[0]?.id ?? null);
  React.useEffect(() => {
    if (focusId && s.apartments.some((a) => a.id === focusId)) setSel(focusId);
  }, [focusId, s.apartments]);
  const rows = s.apartments.filter((a) => {
    if (filter === 'rented' && a.status !== 'rented') return false;
    if (filter === 'vacant' && !['vacant_ready', 'vacant_needs_renovation'].includes(a.status)) return false;
    if (filter === 'work' && !['renovating', 'uninhabitable', 'vacant_needs_renovation'].includes(a.status) && defectsOfApartment(s, a.id).length === 0) return false;
    const t = tenantOf(s, a);
    const qq = q.toLowerCase();
    return !qq || a.number.includes(qq) || (t?.name.toLowerCase().includes(qq) ?? false) || STATUS_LABEL[a.status].toLowerCase().includes(qq);
  });
  const apt = s.apartments.find((a) => a.id === sel) ?? null;
  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
      <Card>
        <CardHeader title="Wohnungen" icon={<DoorOpen size={16} />} subtitle={`${s.apartments.filter((a) => a.status === 'rented').length} vermietet · ${s.apartments.filter((a) => a.status !== 'rented').length} nicht vermietet`} />
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <Tabs value={filter} onChange={setFilter} items={[{ id: 'all', label: 'Alle' }, { id: 'rented', label: 'Vermietet' }, { id: 'vacant', label: 'Leer' }, { id: 'work', label: 'Handlungsbedarf' }]} />
          <div className="relative ml-auto w-full sm:w-52">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-fg" />
            <input className="input h-8 pl-8 text-xs" placeholder="Nummer, Mieter, Status …" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Wohnungen durchsuchen" />
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(a) => a.id}
          selectedKey={sel}
          onRowClick={(a) => setSel(a.id)}
          initialSort={{ key: 'nr', dir: 1 }}
          columns={[
            { key: 'nr', header: 'Whg.', cell: (a) => <span className="font-semibold">{a.number}</span>, sort: (a) => a.floor * 10 + a.position },
            { key: 'st', header: 'Status', cell: (a) => <StatusBadge status={a.status} />, sort: (a) => a.status },
            { key: 'ar', header: 'Fläche', align: 'right', cell: (a) => `${a.area} m²`, sort: (a) => a.area },
            { key: 'mt', header: 'Mieter', cell: (a) => { const t = tenantOf(s, a); return t ? <span className="flex items-center gap-1.5"><SatisfactionFace value={t.satisfaction} />{t.name}</span> : a.listing ? <Badge tone="info">inseriert</Badge> : <span className="text-muted-fg">–</span>; }, sort: (a) => tenantOf(s, a)?.name ?? 'zz' },
            { key: 'rent', header: 'Miete', align: 'right', cell: (a) => { const c = contractOf(s, a); return c ? <Money cents={c.netRent} decimals={false} /> : <span className="text-muted-fg">–</span>; }, sort: (a) => contractOf(s, a)?.netRent ?? 0 },
            { key: 'cmp', header: 'Vergleich', align: 'right', cell: (a) => <Money cents={comparableRent(s, a)} decimals={false} className="text-muted-fg" />, sort: (a) => comparableRent(s, a) },
            { key: 'cond', header: 'Zustand', align: 'right', cell: (a) => <span className={a.condition < 50 ? 'text-danger' : a.condition < 70 ? 'text-warning' : 'text-success'}>{Math.round(a.condition)} %</span>, sort: (a) => a.condition },
            { key: 'def', header: 'Mängel', align: 'center', cell: (a) => { const n = defectsOfApartment(s, a.id).filter((d) => d.discovered).length; return n ? <Badge tone="warning">{n}</Badge> : null; }, sort: (a) => defectsOfApartment(s, a.id).length },
          ]}
          empty="Keine Wohnungen für diesen Filter."
        />
      </Card>
      {apt ? <ApartmentDetail key={apt.id} apt={apt} onTenant={(id) => navigate('tenants', id)} /> : <Card><Empty title="Keine Wohnung gewählt" /></Card>}
    </div>
  );
}

function ApartmentDetail({ apt, onTenant }: { apt: Apartment; onTenant: (id: string) => void }) {
  const s = useGs();
  const dispatch = useDispatch();
  const navigate = useUi((x) => x.navigate);
  const busy = useGame((x) => x.busy);
  const [req, setReq] = React.useState<JobRequest | null>(null);
  const comp = comparableRent(s, apt);
  const max = maxNewLeaseRent(s, apt);
  const [ask, setAsk] = React.useState(apt.listing?.askingRent ?? Math.round(comp / 1000) * 1000);
  const [nk, setNk] = React.useState(apt.listing?.utilityPrepayment ?? Math.round((apt.area * CONFIG.rent.defaultUtilityPerSqm * 1.18) / 500) * 500);
  const [offer, setOffer] = React.useState<Applicant | null>(null);
  const t = tenantOf(s, apt);
  const c = contractOf(s, apt);
  const defects = defectsOfApartment(s, apt.id).filter((d) => d.discovered);
  const applicants = s.applicants.filter((x) => x.apartmentId === apt.id);
  const heat = apartmentHeatingCost(s, apt, t?.energyFactor ?? 1);
  const demand = Math.exp(-(ask / comp - 0.95) * 5);

  return (
    <div className="min-w-0 space-y-5">
      <Card>
        <CardHeader title={`Wohnung ${apt.number}`} subtitle={`${floorLabel(apt.floor, s.building.floors)} · ${apt.layout}`} actions={<StatusBadge status={apt.status} />} />
        <CardBody className="grid gap-4 2xl:grid-cols-2">
          <KeyValue
            items={[
              ['Wohnfläche', `${apt.area} m²`],
              ['Zimmer', apt.rooms.toLocaleString('de-DE')],
              ['Balkon/Terrasse', apt.balcony ? 'ja' : 'nein'],
              ['Küche', LEVEL_LABEL[apt.kitchen]],
              ['Bad', LEVEL_LABEL[apt.bath]],
              ['Böden', LEVEL_LABEL[apt.flooring]],
              ['Fenster', `Stufe ${s.building.components.windows!.tier}`],
              ['Thermostate', apt.smartThermostat ? 'smart' : 'Standard'],
              ['Letzte Renovierung', apt.lastRenovationDay ? formatDate(apt.lastRenovationDay) : 'unbekannt'],
            ]}
          />
          <div className="space-y-3">
            <Meter label="Renovierungszustand" value={apt.condition} hint="Unter 50 % muss die Wohnung vor einer Neuvermietung renoviert werden." />
            <KeyValue
              items={[
                ['Vergleichsmiete', <Money key="c" cents={comp} />],
                ['Je m²', formatMoney(Math.round(comp / apt.area))],
                ['Aktuelle Miete', c ? <Money key="r" cents={c.netRent} /> : '–'],
                ['NK-Vorauszahlung', c ? <Money key="n" cents={c.utilityPrepayment} /> : '–'],
                ['Heizkosten (Schätzung)', `${formatMoney(heat)}/Monat`],
                ['Modernisierungsanteil', <Money key="m" cents={apt.modernizationPool} decimals={false} />],
              ]}
            />
          </div>
        </CardBody>
        {t && (
          <div className="border-t border-border px-4 py-3">
            <button onClick={() => onTenant(t.id)} className="flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left hover:bg-muted">
              <span className="flex items-center gap-2">
                <Portrait id={t.id} name={t.name} archetype={t.archetype} size={40} />
                <SatisfactionFace value={t.satisfaction} size={22} />
                <span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs text-muted-fg">
                    {ARCHETYPE_BY_ID[t.archetype]?.label} · seit {formatDate(t.moveInDay)}
                    {t.status === 'moving_out' && t.moveOutDay ? ` · Auszug ${formatDate(t.moveOutDay)}` : ''}
                  </span>
                </span>
              </span>
              <span className="num text-sm font-semibold">{Math.round(t.satisfaction)} %</span>
            </button>
          </div>
        )}
      </Card>

      {defects.length > 0 && (
        <Card>
          <CardHeader title="Mängel in der Wohnung" icon={<Wrench size={16} />} />
          <CardBody className="space-y-2">
            {defects.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Badge tone={SEVERITY_TONE[d.severity]}>{SEVERITY_TEXT[d.severity]}</Badge>
                    {DEFECT_TYPES[d.type].label}
                  </div>
                  <div className="truncate text-xs text-muted-fg">{d.cause} · seit {formatDate(d.discoveredDay ?? d.createdDay)}</div>
                </div>
                {d.jobId ? <Badge tone="primary">beauftragt</Badge> : <Button size="sm" onClick={() => setReq({ kind: 'repair', defectId: d.id })}>Angebote</Button>}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {(apt.status === 'vacant_needs_renovation' || apt.status === 'vacant_ready') && (
        <Card>
          <CardHeader title={apt.status === 'vacant_ready' ? 'Vermietung' : 'Renovierung erforderlich'} icon={<Megaphone size={16} />} actions={!t && <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'inspectApartment', aptId: apt.id })}><Eye size={14} /> Besichtigen</Button>} />
          <CardBody className="space-y-3">
            {apt.status === 'vacant_needs_renovation' ? (
              <>
                <p className="text-sm text-muted-fg">Der Zustand ({Math.round(apt.condition)} %) ist für eine Neuvermietung zu schlecht. Mindestens 50 % sind nötig – ein Anstrich bringt +22 Punkte, eine Komplettsanierung macht die Wohnung wie neu.</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setReq({ kind: 'measure', measureId: 'apt_paint', apartmentId: apt.id })}>Wände streichen</Button>
                  <Button variant="outline" onClick={() => setReq({ kind: 'measure', measureId: 'apt_full', apartmentId: apt.id })}>Komplettsanierung</Button>
                  <Button variant="ghost" onClick={() => navigate('renovation', apt.id)}>Alle Maßnahmen</Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Angebotsmiete (kalt)" hint={`Vergleichsmiete ${formatMoney(comp)} · max. ${formatMoney(max)}`}>
                    <EuroInput value={ask} onChange={setAsk} max={max} step={10} aria-label="Angebotsmiete" />
                  </Field>
                  <Field label="NK-Vorauszahlung" hint={`Empfehlung ≈ ${formatMoney(Math.round(apt.area * CONFIG.rent.defaultUtilityPerSqm * 1.18))}`}>
                    <EuroInput value={nk} onChange={setNk} step={5} aria-label="Nebenkostenvorauszahlung" />
                  </Field>
                </div>
                <input type="range" min={Math.round(comp * 0.75)} max={max} step={1000} value={Math.min(max, ask)} onChange={(e) => setAsk(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" aria-label="Angebotsmiete Regler" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-fg">Erwartete Nachfrage</span>
                  <Badge tone={demand > 0.9 ? 'success' : demand > 0.55 ? 'warning' : 'danger'}>{demand > 0.9 ? 'hoch' : demand > 0.55 ? 'mittel' : 'gering'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => dispatch({ type: 'listApartment', aptId: apt.id, askingRent: ask, utilityPrepayment: nk })}>
                    <Megaphone size={14} /> {apt.listing ? 'Inserat aktualisieren' : `Inserieren (${formatMoney(CONFIG.rent.listingCost)})`}
                  </Button>
                  {apt.listing && (
                    <Button variant="outline" onClick={() => dispatch({ type: 'unlistApartment', aptId: apt.id })}>
                      Inserat zurückziehen
                    </Button>
                  )}
                </div>
                {apt.listing && <p className="text-xs text-muted-fg">Inseriert seit {formatDate(apt.listing.sinceDay)} für {formatMoney(apt.listing.askingRent)} kalt.</p>}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {applicants.length > 0 && (
        <Card>
          <CardHeader title={`Bewerbungen (${applicants.length})`} icon={<UserPlus size={16} />} subtitle="Vergleichen Sie die Interessenten – jeder hat Vor- und Nachteile" />
          <CardBody className="space-y-3">
            {applicants.map((ap) => (
              <ApplicantCard key={ap.id} ap={ap} apt={apt} onOffer={() => setOffer(ap)} onReject={() => dispatch({ type: 'rejectApplicant', applicantId: ap.id })} />
            ))}
          </CardBody>
        </Card>
      )}
      {offer && <OfferDialog ap={offer} apt={apt} onClose={() => setOffer(null)} />}
      <JobDialog request={req} open={!!req} onOpenChange={(v) => !v && setReq(null)} />
    </div>
  );
}

function ApplicantCard({ ap, apt, onOffer, onReject }: { ap: Applicant; apt: Apartment; onOffer: () => void; onReject: () => void }) {
  const s = useGs();
  const fit = applicantFit(s, ap, apt);
  const arch = ARCHETYPE_BY_ID[ap.archetype];
  const ask = apt.listing?.askingRent ?? comparableRent(s, apt);
  const willingness = ap.maxRent / ask;
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <Portrait id={ap.id} name={ap.name} archetype={ap.archetype} size={44} />
          <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {ap.name}
            {ap.referredBy && <Badge tone="success">Empfehlung</Badge>}
            {ap.pets && (
              <Tip content="Haustiere">
                <PawPrint size={13} className="text-muted-fg" />
              </Tip>
            )}
          </div>
          <div className="text-xs text-muted-fg">
            {arch?.label} · {ap.occupation} · {ap.householdSize} Pers.
          </div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn('num text-lg font-bold', fit.score >= 0.7 ? 'text-success' : fit.score >= 0.5 ? 'text-warning' : 'text-danger')}>{Math.round(fit.score * 100)} %</div>
          <div className="text-[10px] uppercase text-muted-fg">Passung</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <span>
          <span className="text-muted-fg">Einkommen </span>
          <span className="num font-medium">{formatMoney(ap.monthlyIncome, { decimals: false })}</span>
        </span>
        <span>
          <span className="text-muted-fg">Bonität </span>
          <span className={cn('num font-medium', ap.creditScore >= 75 ? 'text-success' : ap.creditScore < 50 ? 'text-danger' : '')}>{ap.creditScore}</span>
        </span>
        <span>
          <span className="text-muted-fg">Einzug </span>
          <span className="font-medium">{ap.desiredMoveInDays <= 3 ? 'sofort' : `in ${ap.desiredMoveInDays} T.`}</span>
        </span>
        <span>
          <span className="text-muted-fg">Bleibt ca. </span>
          <span className="font-medium">{Math.round(ap.expectedStayYears)} J.</span>
        </span>
        <span className="col-span-2">
          <span className="text-muted-fg">Zahlungsbereitschaft </span>
          <span className="font-medium">{willingness >= 1.05 ? 'über Angebot' : willingness >= 1 ? 'passt zum Angebot' : willingness >= 0.92 ? 'knapp darunter' : 'deutlich darunter'}</span>
        </span>
        <span className="col-span-2 truncate">
          <span className="text-muted-fg">Wünsche </span>
          {ap.needs.map((n) => NEED_LABEL[n]).join(', ') || '–'}
        </span>
      </div>
      <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
        <ul className="space-y-0.5">
          {fit.pros.slice(0, 4).map((p) => (
            <li key={p} className="flex gap-1 text-success">
              <ThumbsUp size={11} className="mt-0.5 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
        <ul className="space-y-0.5">
          {fit.cons.slice(0, 4).map((p) => (
            <li key={p} className="flex gap-1 text-danger">
              <ThumbsDown size={11} className="mt-0.5 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-fg">Bewerbung gültig bis {formatDate(ap.expiresDay)}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onReject}>
            <XCircle size={13} /> Absagen
          </Button>
          <Button size="sm" onClick={onOffer}>
            <CheckCircle2 size={13} /> Vertrag anbieten
          </Button>
        </div>
      </div>
    </div>
  );
}

function OfferDialog({ ap, apt, onClose }: { ap: Applicant; apt: Apartment; onClose: () => void }) {
  const s = useGs();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const [rent, setRent] = React.useState(apt.listing?.askingRent ?? comparableRent(s, apt));
  const [nk, setNk] = React.useState(apt.listing?.utilityPrepayment ?? Math.round(apt.area * CONFIG.rent.defaultUtilityPerSqm));
  const max = maxNewLeaseRent(s, apt);
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Mietvertrag für ${ap.name}`}
      description={`Wohnung ${apt.number} · ${apt.area} m²`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              const r = dispatch({ type: 'offerLease', applicantId: ap.id, netRent: rent, utilityPrepayment: nk });
              if (r.ok) onClose();
            }}
          >
            Vertrag anbieten
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nettokaltmiete" hint={`Zulässig bis ${formatMoney(max)}`}>
          <EuroInput value={rent} onChange={setRent} max={max} aria-label="Nettokaltmiete" />
        </Field>
        <Field label="NK-Vorauszahlung">
          <EuroInput value={nk} onChange={setNk} aria-label="NK-Vorauszahlung" />
        </Field>
      </div>
      <KeyValue
        className="mt-4"
        items={[
          ['Warmmiete', formatMoney(rent + nk)],
          ['Anteil am Einkommen', `${Math.round(((rent + nk) / ap.monthlyIncome) * 100)} %`],
          ['Kaution (3 Kaltmieten)', formatMoney(rent * 3)],
          ['Mietbeginn', 'sofort (anteilige Miete für den laufenden Monat)'],
        ]}
      />
      <p className="mt-3 text-xs text-muted-fg">Liegt die Miete über dem Budget des Bewerbers, sinkt die Zusagewahrscheinlichkeit deutlich. Die Kaution wird treuhänderisch verwahrt und ist kein verfügbares Geld.</p>
    </Modal>
  );
}
