import * as React from 'react';
import type { Apartment, ComponentKey, GameState } from '@/domain/schema';
import { DEFECT_TYPES } from '@/content/defects';
import { COMPONENTS } from '@/content/components';
import { seasonOf } from '@/utils/date';
import { STATUS_LABEL } from '../common';
import { CONFIG } from '@/game/config';

interface Props {
  s: GameState;
  selectedId?: string | null;
  onSelectApartment?: (id: string) => void;
  onSelectComponent?: (k: ComponentKey) => void;
  className?: string;
}

const UNIT_W = 128;
const STAIR_W = 46;
const FLOOR_H = 92;
const ROOF_H = 84;
const BASE_H = 54;
const SIDE = 70;
const SKY_H = 40;

/** Interaktive Gebäudeansicht. Alle Darstellungen leiten sich aus dem Spielzustand ab. */
export function BuildingView({ s, selectedId, onSelectApartment, onSelectComponent, className }: Props) {
  const b = s.building;
  const floors = b.floors;
  const perFloor = Math.max(...Array.from({ length: floors }, (_, f) => s.apartments.filter((a) => a.floor === f).length));
  const houseW = perFloor * UNIT_W + STAIR_W;
  const W = houseW + SIDE * 2;
  const groundY = SKY_H + ROOF_H + floors * FLOOR_H;
  const H = groundY + BASE_H + 26;
  const x0 = SIDE;
  const season = seasonOf(s.day);
  const c = b.components;
  const openDef = (k: ComponentKey) => s.defects.filter((d) => d.resolvedDay === null && d.discovered && d.target.kind === 'component' && d.target.key === k);
  const hasDefect = (type: string) => s.defects.some((d) => d.resolvedDay === null && d.discovered && d.type === type);
  const buildingJobs = s.jobs.filter((j) => j.status === 'in_progress' && (j.target.kind === 'building' || j.target.kind === 'component'));
  const scaffold = buildingJobs.some((j) => ['facade_renewal', 'facade_insulation', 'windows_replace', 'roof_renovation'].includes(j.measureId ?? '') || (j.target.kind === 'component' && ['facade', 'roof'].includes(j.target.key)));
  const facadeCond = c.facade!.condition;
  const facadeFill = b.insulationLevel >= 2 ? `hsl(40 ${30 + facadeCond / 5}% ${70 + facadeCond / 10}%)` : `hsl(32 ${12 + facadeCond / 4}% ${52 + facadeCond / 5}%)`;
  const roofCond = c.roof!.condition;
  const roofFill = roofCond >= 70 ? '#9a3b2c' : roofCond >= 45 ? '#8a5a48' : '#6b6461';
  const sky = { winter: ['#cbd5e1', '#e2e8f0'], spring: ['#bae6fd', '#e0f2fe'], summer: ['#7dd3fc', '#e0f2fe'], autumn: ['#fcd9b6', '#fde7d1'] }[season];
  const grass = s.building.outdoorCare >= 60 ? '#4d7c0f' : s.building.outdoorCare >= 35 ? '#65733a' : '#7c6f4a';
  const winTier = c.windows!.tier;
  const frame = winTier >= 4 ? '#f8fafc' : winTier >= 3 ? '#e5e7eb' : '#7c4a2a';
  const stairX = x0 + UNIT_W; // Treppenhaus nach der ersten Wohnung
  const sel = (k: ComponentKey) => (onSelectComponent ? () => onSelectComponent(k) : undefined);
  const heatingOut = hasDefect('heating_failure');
  const chimney = CONFIG.energy.heating[b.heatingSystem].chimney;

  const aptX = (a: Apartment) => (a.position === 0 ? x0 : x0 + STAIR_W + a.position * UNIT_W);
  const aptY = (a: Apartment) => groundY - (a.floor + 1) * FLOOR_H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`Gebäudeansicht ${b.name}`}>
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <pattern id="scaffold" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 0 L16 16 M16 0 L0 16" stroke="#b45309" strokeWidth="1.2" opacity="0.55" />
        </pattern>
        <pattern id="bricks" width="18" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 10 H18 M9 0 V5 M0 5 H18 M0 0 V5 M18 5 V10" stroke="#000" strokeOpacity="0.06" fill="none" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={groundY} fill="url(#sky)" className="dark:opacity-60" />
      {/* Sonne / Wolke */}
      {season === 'summer' && <circle cx={W - 40} cy={30} r={14} fill="#fde047" opacity="0.9" />}
      {season !== 'summer' && <ellipse cx={50} cy={28} rx={26} ry={9} fill="#fff" opacity="0.7" />}

      {/* Außenbereich */}
      <g onClick={sel('outdoor')} className={onSelectComponent ? 'cursor-pointer' : ''}>
        <title>{`Außenbereich – Zustand ${Math.round(c.outdoor!.condition)} %, Pflege ${Math.round(b.outdoorCare)} %`}</title>
        <rect x="0" y={groundY} width={W} height={10} fill={season === 'winter' ? '#e5e7eb' : grass} />
        <Tree x={22} y={groundY} season={season} care={b.outdoorCare} />
        {b.amenities.includes('garden') && <Flowers x={W - SIDE + 8} y={groundY} />}
        <Bins x={W - 30} y={groundY} overflow={b.outdoorCare < 40 || hasDefect('outdoor_waste')} />
        {b.amenities.includes('bike_storage') && <Bikes x={W - SIDE + 6} y={groundY} />}
        {hasDefect('pests') && <text x={W - 55} y={groundY + 8} fontSize="10">🐀</text>}
      </g>

      {/* Keller */}
      <g onClick={sel('basement')} className={onSelectComponent ? 'cursor-pointer' : ''}>
        <title>{`Keller – Zustand ${Math.round(c.basement!.condition)} %. Heizung: ${CONFIG.energy.heating[b.heatingSystem].label}, Zustand ${Math.round(c.heating!.condition)} %`}</title>
        <rect x={x0} y={groundY + 10} width={houseW} height={BASE_H - 10} fill="#57534e" />
        <rect x={x0} y={groundY + 10} width={houseW} height={BASE_H - 10} fill="url(#bricks)" />
        {(c.basement!.condition < 50 || hasDefect('basement_moisture') || hasDefect('basement_mold')) && (
          <>
            <ellipse cx={x0 + 40} cy={groundY + 34} rx={16} ry={7} fill="#1e3a2a" opacity="0.5" />
            <ellipse cx={x0 + houseW - 60} cy={groundY + 30} rx={11} ry={6} fill="#1e3a2a" opacity="0.45" />
          </>
        )}
        <g transform={`translate(${x0 + houseW / 2 - 18}, ${groundY + 18})`} onClick={(e) => { if (onSelectComponent) { e.stopPropagation(); onSelectComponent('heating'); } }}>
          <title>{`Heizung: ${CONFIG.energy.heating[b.heatingSystem].label} – Zustand ${Math.round(c.heating!.condition)} %`}</title>
          <rect width="36" height="26" rx="3" fill={heatingOut ? '#7f1d1d' : c.heating!.condition < 40 ? '#92400e' : '#334155'} stroke="#0f172a" />
          <text x="18" y="18" textAnchor="middle" fontSize="13">{heatingOut ? '❄' : '🔥'}</text>
        </g>
        {b.amenities.includes('laundry_room') && <text x={x0 + 14} y={groundY + 44} fontSize="11">🧺</text>}
      </g>

      {/* Fassade */}
      <g onClick={sel('facade')} className={onSelectComponent ? 'cursor-pointer' : ''}>
        <title>{`Fassade – Zustand ${Math.round(facadeCond)} %${b.insulationLevel ? `, Dämmstufe ${b.insulationLevel}` : ', ungedämmt'}`}</title>
        <rect x={x0} y={groundY - floors * FLOOR_H} width={houseW} height={floors * FLOOR_H + 10} fill={facadeFill} stroke="#44403c" strokeWidth="1.2" />
        {b.amenities.includes('greening') && <path d={`M${x0} ${groundY} q 6 -60 2 -120 q 10 40 6 120`} fill="#3f6212" opacity="0.8" />}
        {facadeCond < 50 && (
          <path d={`M${x0 + 30} ${groundY - 40} l 8 18 l -6 14 M${x0 + houseW - 40} ${groundY - floors * FLOOR_H + 30} l -6 16 l 8 12 l -4 10`} stroke="#3f3f46" strokeWidth="1.3" fill="none" opacity={(60 - facadeCond) / 50} />
        )}
        {hasDefect('graffiti') && <text x={x0 + 8} y={groundY - 12} fontSize="12" fill="#c026d3" fontWeight="bold" fontStyle="italic">~#Tag</text>}
      </g>

      {/* Treppenhaus */}
      <g onClick={sel('stairwell')} className={onSelectComponent ? 'cursor-pointer' : ''}>
        <title>{`Treppenhaus – Zustand ${Math.round(c.stairwell!.condition)} %, Sauberkeit ${Math.round(b.cleanliness)} %`}</title>
        <rect x={stairX} y={groundY - floors * FLOOR_H} width={STAIR_W} height={floors * FLOOR_H} fill="#000" opacity={0.06 + (100 - b.cleanliness) / 600} />
        {Array.from({ length: floors }, (_, f) => (
          <rect key={f} x={stairX + 13} y={groundY - (f + 1) * FLOOR_H + 30} width={20} height={34} rx={2} fill={hasDefect('stairwell_light') ? '#334155' : '#fef3c7'} stroke={frame} strokeWidth="2" />
        ))}
        <rect x={stairX + 9} y={groundY - 46} width={28} height={46} rx={2} fill={hasDefect('door_lock') ? '#7f1d1d' : b.amenities.includes('intercom') ? '#1e3a8a' : '#78350f'} />
        <circle cx={stairX + 31} cy={groundY - 22} r={1.6} fill="#fde68a" />
      </g>

      {/* Wohnungen */}
      {s.apartments.map((a) => {
        const x = aptX(a);
        const y = aptY(a);
        const t = a.tenantId ? s.tenants.find((tt) => tt.id === a.tenantId) : null;
        const defects = s.defects.filter((d) => d.resolvedDay === null && d.discovered && d.target.kind === 'apartment' && d.target.apartmentId === a.id);
        const maxSev = defects.reduce((m, d) => Math.max(m, d.severity), 0);
        const glass =
          a.status === 'rented' ? (heatingOut ? '#bfdbfe' : '#fde68a') : a.status === 'vacant_ready' ? '#dbeafe' : a.status === 'renovating' ? '#fdba74' : a.status === 'uninhabitable' ? '#fca5a5' : '#9ca3af';
        const selected = selectedId === a.id;
        return (
          <g key={a.id} onClick={onSelectApartment ? () => onSelectApartment(a.id) : undefined} className={onSelectApartment ? 'cursor-pointer' : ''} role={onSelectApartment ? 'button' : undefined} aria-label={`Wohnung ${a.number}`} tabIndex={onSelectApartment ? 0 : undefined} onKeyDown={(e) => { if (onSelectApartment && (e.key === 'Enter' || e.key === ' ')) onSelectApartment(a.id); }}>
            <title>{`Whg. ${a.number} – ${STATUS_LABEL[a.status]}${t ? ` – ${t.name} (Zufriedenheit ${Math.round(t.satisfaction)} %)` : ''} – Zustand ${Math.round(a.condition)} %${defects.length ? ` – ${defects.map((d) => DEFECT_TYPES[d.type].label).join(', ')}` : ''}`}</title>
            <rect x={x + 3} y={y + 3} width={UNIT_W - 6} height={FLOOR_H - 6} rx={4} fill={selected ? 'hsl(var(--primary) / 0.18)' : 'transparent'} stroke={selected ? 'hsl(var(--primary))' : 'transparent'} strokeWidth="2.5" className="transition hover:fill-[hsl(var(--primary)/0.08)]" />
            {[0, 1].map((i) => (
              <g key={i}>
                <rect x={x + 18 + i * 52} y={y + 22} width={40} height={42} rx={2} fill={glass} stroke={frame} strokeWidth={winTier >= 4 ? 3 : 2.5} />
                <line x1={x + 38 + i * 52} y1={y + 22} x2={x + 38 + i * 52} y2={y + 64} stroke={frame} strokeWidth="1.5" />
                {a.status === 'vacant_needs_renovation' && <line x1={x + 18 + i * 52} y1={y + 30} x2={x + 58 + i * 52} y2={y + 56} stroke="#78716c" strokeWidth="3" />}
                {t && a.status === 'rented' && !heatingOut && i === 1 && <rect x={x + 72} y={y + 24} width={12} height={38} fill="#fca5a5" opacity="0.55" />}
              </g>
            ))}
            {a.balcony && <rect x={x + 12} y={y + 64} width={UNIT_W - 24} height={8} rx={1} fill="none" stroke="#475569" strokeWidth="2" />}
            <text x={x + 10} y={y + 15} fontSize="11" fontWeight="700" fill="#1f2937">{a.number}</text>
            {t && (
              <circle cx={x + UNIT_W - 30} cy={y + 11} r={5} fill={t.satisfaction >= 70 ? '#16a34a' : t.satisfaction >= 45 ? '#d97706' : '#dc2626'}>
                <title>{`Zufriedenheit ${Math.round(t.satisfaction)} %`}</title>
              </circle>
            )}
            {t?.status === 'moving_out' && <text x={x + UNIT_W - 52} y={y + 15} fontSize="11">📦</text>}
            {maxSev > 0 && (
              <g transform={`translate(${x + UNIT_W - 18}, ${y + 4})`}>
                <circle cx="6" cy="7" r="7" fill={maxSev >= 3 ? '#dc2626' : maxSev === 2 ? '#ea580c' : '#ca8a04'} className={maxSev >= 3 ? 'animate-pulse' : ''} />
                <text x="6" y="11" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">!</text>
              </g>
            )}
            {a.listing && <text x={x + UNIT_W / 2} y={y + 86} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">ZU VERMIETEN</text>}
            {a.status === 'renovating' && <rect x={x + 3} y={y + 3} width={UNIT_W - 6} height={FLOOR_H - 6} fill="url(#scaffold)" />}
          </g>
        );
      })}

      {/* Dach */}
      <g onClick={sel('roof')} className={onSelectComponent ? 'cursor-pointer' : ''}>
        <title>{`Dach – Zustand ${Math.round(roofCond)} %${openDef('roof').length ? ` – ${openDef('roof').map((d) => DEFECT_TYPES[d.type].label).join(', ')}` : ''}`}</title>
        <path d={`M${x0 - 14} ${groundY - floors * FLOOR_H} L${x0 + houseW / 2} ${SKY_H} L${x0 + houseW + 14} ${groundY - floors * FLOOR_H} Z`} fill={roofFill} stroke="#3f1d14" strokeWidth="1.5" />
        {Array.from({ length: 5 }, (_, i) => {
          const yy = SKY_H + ((i + 1) * ROOF_H) / 6;
          const half = ((yy - SKY_H) / ROOF_H) * (houseW / 2 + 14);
          return <line key={i} x1={x0 + houseW / 2 - half} y1={yy} x2={x0 + houseW / 2 + half} y2={yy} stroke="#000" strokeOpacity="0.15" />;
        })}
        {roofCond < 45 && <rect x={x0 + houseW / 2 - 40} y={SKY_H + 44} width={14} height={8} fill="#1c1917" opacity="0.7" />}
        {season === 'winter' && <path d={`M${x0 + houseW / 2 - 60} ${SKY_H + 26} L${x0 + houseW / 2} ${SKY_H + 2} L${x0 + houseW / 2 + 60} ${SKY_H + 26} Z`} fill="#fff" opacity="0.85" />}
        {b.amenities.includes('solar') && (
          <g>
            {Array.from({ length: 4 }, (_, i) => (
              <rect key={i} x={x0 + houseW / 2 + 12 + i * 22} y={SKY_H + 36 + i * 8} width={20} height={12} fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1" transform={`skewY(20)`} opacity="0.95" />
            ))}
          </g>
        )}
        {hasDefect('roof_leak') && <text x={x0 + houseW / 2 - 8} y={SKY_H + 70} fontSize="14">💧</text>}
      </g>
      {/* Schornstein */}
      <g onClick={sel('heating')} className={onSelectComponent ? 'cursor-pointer' : ''}>
        <rect x={x0 + houseW * 0.7} y={SKY_H + 18} width={16} height={36} fill="#7c2d12" />
        {chimney && !heatingOut && (season === 'winter' || season === 'autumn') && (
          <g opacity="0.55">
            <circle cx={x0 + houseW * 0.7 + 8} cy={SKY_H + 8} r={6} fill="#94a3b8" />
            <circle cx={x0 + houseW * 0.7 + 16} cy={SKY_H - 2} r={8} fill="#cbd5e1" />
          </g>
        )}
      </g>
      {b.heatingSystem === 'heat_pump' && (
        <g transform={`translate(${x0 + houseW + 8}, ${groundY - 30})`}>
          <title>Wärmepumpe</title>
          <rect width="34" height="30" rx="3" fill="#e2e8f0" stroke="#475569" />
          <circle cx="17" cy="15" r="10" fill="none" stroke="#475569" strokeWidth="2" />
        </g>
      )}
      {scaffold && <rect x={x0 - 8} y={groundY - floors * FLOOR_H - 4} width={houseW + 16} height={floors * FLOOR_H + 4} fill="url(#scaffold)" stroke="#b45309" strokeWidth="2" opacity="0.8"><title>Baugerüst – Arbeiten an der Gebäudehülle</title></rect>}
      {/* Bodenlinie */}
      <rect x="0" y={groundY + BASE_H} width={W} height={H - groundY - BASE_H} fill="#3f3f46" opacity="0.25" />
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">{`${b.address} · Baujahr ${b.yearBuilt} · ${COMPONENTS.heating.label}: ${CONFIG.energy.heating[b.heatingSystem].label}`}</text>
    </svg>
  );
}

function Tree({ x, y, season, care }: { x: number; y: number; season: string; care: number }) {
  const leaf = season === 'winter' ? 'transparent' : season === 'autumn' ? '#c2410c' : care > 50 ? '#15803d' : '#4d7c0f';
  return (
    <g>
      <rect x={x - 3} y={y - 40} width={6} height={40} fill="#78350f" />
      <circle cx={x} cy={y - 50} r={18} fill={leaf} stroke={season === 'winter' ? '#78350f' : 'none'} />
    </g>
  );
}
function Bins({ x, y, overflow }: { x: number; y: number; overflow: boolean }) {
  return (
    <g>
      <rect x={x - 10} y={y - 18} width={9} height={18} rx={1} fill="#334155" />
      <rect x={x} y={y - 18} width={9} height={18} rx={1} fill="#1d4ed8" />
      {overflow && (
        <>
          <ellipse cx={x - 16} cy={y - 4} rx={6} ry={4} fill="#57534e" />
          <ellipse cx={x + 14} cy={y - 3} rx={5} ry={3} fill="#44403c" />
        </>
      )}
    </g>
  );
}
function Flowers({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 10, 20, 30].map((d, i) => (
        <circle key={i} cx={x + d} cy={y - 4} r={3} fill={['#f43f5e', '#facc15', '#a855f7', '#fb923c'][i]} />
      ))}
    </g>
  );
}
function Bikes({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#0f172a" strokeWidth="1.5" fill="none">
      <circle cx={x + 6} cy={y - 6} r={5} />
      <circle cx={x + 20} cy={y - 6} r={5} />
      <path d={`M${x + 6} ${y - 6} L${x + 12} ${y - 14} L${x + 20} ${y - 6}`} />
    </g>
  );
}

export const BuildingViewMemo = React.memo(BuildingView);
