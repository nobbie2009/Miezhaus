import * as React from 'react';
import { Star } from 'lucide-react';
import type { ApartmentStatus, Job } from '@/domain/schema';
import { Badge, type Tone } from '@/components/ui';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/misc';

export const STATUS_LABEL: Record<ApartmentStatus, string> = {
  vacant_ready: 'Leer – bezugsfertig',
  rented: 'Vermietet',
  vacant_needs_renovation: 'Leer – renovierungsbedürftig',
  renovating: 'In Renovierung',
  uninhabitable: 'Nicht bewohnbar',
  blocked: 'Gesperrt',
};
export const STATUS_TONE: Record<ApartmentStatus, Tone> = {
  vacant_ready: 'info',
  rented: 'success',
  vacant_needs_renovation: 'warning',
  renovating: 'primary',
  uninhabitable: 'danger',
  blocked: 'neutral',
};
export const StatusBadge = ({ status }: { status: ApartmentStatus }) => <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;

export const URGENCY_LABEL: Record<Job['urgency'], string> = { low: 'Geplant', normal: 'Normal', high: 'Dringend', critical: 'Kritisch' };
export const URGENCY_TONE: Record<Job['urgency'], Tone> = { low: 'neutral', normal: 'info', high: 'warning', critical: 'danger' };
export const SEVERITY_TONE: Tone[] = ['neutral', 'info', 'warning', 'danger'];
export const SEVERITY_TEXT = ['', 'Gering', 'Erheblich', 'Kritisch'];

export const JOB_STATUS_LABEL: Record<Job['status'], string> = { scheduled: 'Geplant', in_progress: 'In Arbeit', done: 'Erledigt', cancelled: 'Storniert' };

export function Money({ cents, className, signed, decimals = true, colored }: { cents: number; className?: string; signed?: boolean; decimals?: boolean; colored?: boolean }) {
  const txt = formatMoney(cents, { decimals });
  return <span className={cn('num whitespace-nowrap', colored && (cents < 0 ? 'text-danger' : cents > 0 ? 'text-success' : ''), className)}>{signed && cents > 0 ? `+${txt}` : txt}</span>;
}

export const Stars = ({ value, max = 5 }: { value: number; max?: number }) => (
  <span className="inline-flex" aria-label={`${value} von ${max}`}>
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} size={12} className={i < value ? 'fill-accent text-accent' : 'text-muted-fg/40'} />
    ))}
  </span>
);

/** Zahl, die bei Änderung kurz aufleuchtet und den Unterschied anzeigt. */
export function AnimatedMoney({ cents, className }: { cents: number; className?: string }) {
  const prev = React.useRef(cents);
  const [delta, setDelta] = React.useState<{ v: number; k: number } | null>(null);
  React.useEffect(() => {
    const d = cents - prev.current;
    prev.current = cents;
    if (d !== 0 && Math.abs(d) >= 100) setDelta({ v: d, k: Date.now() });
  }, [cents]);
  return (
    <span className={cn('relative inline-flex', className)}>
      <span key={delta?.k} className={cn('num', delta && 'animate-pop', cents < 0 && 'text-danger')}>
        {formatMoney(cents)}
      </span>
      {delta && (
        <span key={`d${delta.k}`} className={cn('num pointer-events-none absolute -top-3 right-0 animate-float-up text-[11px] font-bold', delta.v > 0 ? 'text-success' : 'text-danger')}>
          {delta.v > 0 ? '+' : ''}
          {formatMoney(delta.v, { decimals: false })}
        </span>
      )}
    </span>
  );
}

export const satTone = (v: number): Tone => (v >= 70 ? 'success' : v >= 45 ? 'warning' : 'danger');

export function SatisfactionFace({ value, size = 16 }: { value: number; size?: number }) {
  const color = value >= 70 ? 'hsl(var(--success))' : value >= 45 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';
  const mouth = value >= 70 ? 'M6 11 Q9 14 12 11' : value >= 45 ? 'M6 12 L12 12' : 'M6 13 Q9 10 12 13';
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-label={`Zufriedenheit ${Math.round(value)} %`}>
      <circle cx="9" cy="9" r="8" fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx="6.3" cy="7" r="1" fill={color} />
      <circle cx="11.7" cy="7" r="1" fill={color} />
      <path d={mouth} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
