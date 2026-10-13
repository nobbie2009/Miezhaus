import * as React from 'react';
import * as RD from '@radix-ui/react-dialog';
import * as RT from '@radix-ui/react-tooltip';
import { ArrowDown, ArrowUp, ChevronsUpDown, Info, X } from 'lucide-react';
import { cn } from '@/utils/misc';

// ------------------------------------------------------------- Button
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
type BtnSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}

const btnVariant: Record<BtnVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary/90 shadow-sm',
  secondary: 'bg-muted text-fg hover:bg-muted/70',
  ghost: 'hover:bg-muted text-fg',
  danger: 'bg-danger text-white hover:bg-danger/90',
  success: 'bg-success text-white hover:bg-success/90',
  outline: 'border border-border bg-card hover:bg-muted',
};
const btnSize: Record<BtnSize, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'md', ...p }, ref) => (
  <button
    ref={ref}
    className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-lg font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45', btnVariant[variant], btnSize[size], className)}
    {...p}
  />
));
Button.displayName = 'Button';

// ------------------------------------------------------------- Card
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('min-w-0 rounded-xl border border-border bg-card shadow-sm', className)} {...p} />;
export const CardHeader = ({ className, title, subtitle, icon, actions }: { className?: string; title: React.ReactNode; subtitle?: React.ReactNode; icon?: React.ReactNode; actions?: React.ReactNode }) => (
  <div className={cn('flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3', className)}>
    <div className="flex min-w-0 items-center gap-2.5">
      {icon && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        {subtitle && <p className="truncate text-xs text-muted-fg">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
  </div>
);
export const CardBody = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-4', className)} {...p} />;

// ------------------------------------------------------------- Badge
export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
const toneCls: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-fg',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-info/12 text-info',
  accent: 'bg-accent/15 text-accent',
};
export const Badge = ({ tone = 'neutral', className, children, title }: { tone?: Tone; className?: string; children: React.ReactNode; title?: string }) => (
  <span title={title} className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold', toneCls[tone], className)}>
    {children}
  </span>
);

// ------------------------------------------------------------- Progress / Meter
export const conditionTone = (v: number): Tone => (v >= 70 ? 'success' : v >= 45 ? 'warning' : 'danger');
const barCls: Record<Tone, string> = { neutral: 'bg-muted-fg', primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info', accent: 'bg-accent' };

export const Progress = ({ value, tone, className, label }: { value: number; tone?: Tone; className?: string; label?: string }) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', barCls[tone ?? conditionTone(v)])} style={{ width: `${v}%` }} />
    </div>
  );
};

export const Meter = ({ label, value, hint, suffix = '%' }: { label: React.ReactNode; value: number; hint?: string; suffix?: string }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="flex items-center gap-1 text-muted-fg">
        {label}
        {hint && <InfoTip text={hint} />}
      </span>
      <span className="num font-semibold">
        {Math.round(value)}
        {suffix}
      </span>
    </div>
    <Progress value={value} />
  </div>
);

// ------------------------------------------------------------- Tooltip
export const TooltipProvider = RT.Provider;
export function Tip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  if (!content) return <>{children}</>;
  return (
    <RT.Root delayDuration={250}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content side={side} sideOffset={6} className="z-[80] max-w-xs animate-fade-in rounded-lg border border-border bg-card px-3 py-2 text-xs leading-relaxed text-fg shadow-xl">
          {content}
          <RT.Arrow className="fill-card" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
export const InfoTip = ({ text }: { text: React.ReactNode }) => (
  <Tip content={text}>
    <button type="button" className="inline-flex text-muted-fg/70 hover:text-fg" aria-label="Erklärung">
      <Info size={12} />
    </button>
  </Tip>
);

// ------------------------------------------------------------- Dialog
export function Modal({ open, onOpenChange, title, description, children, footer, wide, xwide }: { open: boolean; onOpenChange: (v: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; wide?: boolean; xwide?: boolean }) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 animate-fade-in bg-black/45 backdrop-blur-[2px]" />
        <RD.Content className={cn('fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 animate-fade-in flex-col rounded-2xl border border-border bg-card shadow-2xl', xwide ? 'max-w-5xl' : wide ? 'max-w-3xl' : 'max-w-lg')}>
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <RD.Title className="text-base font-semibold">{title}</RD.Title>
              {description ? <RD.Description className="mt-0.5 text-sm text-muted-fg">{description}</RD.Description> : <RD.Description className="sr-only">Dialog</RD.Description>}
            </div>
            <RD.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Schließen">
                <X size={16} />
              </Button>
            </RD.Close>
          </div>
          <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

/** Bestätigungsdialog für irreversible Aktionen. */
export function Confirm({ open, onOpenChange, title, text, confirmLabel = 'Bestätigen', danger, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; text: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void }) {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (open) setDone(false);
  }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            disabled={done}
            onClick={() => {
              if (done) return;
              setDone(true);
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed">{text}</div>
    </Modal>
  );
}

// ------------------------------------------------------------- Stat
export function Stat({ label, value, sub, tone, icon, hint, trend, onClick }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone; icon?: React.ReactNode; hint?: React.ReactNode; trend?: number | null; onClick?: () => void }) {
  const toneText: Partial<Record<Tone, string>> = { success: 'text-success', warning: 'text-warning', danger: 'text-danger', primary: 'text-primary', info: 'text-info' };
  return (
    <div onClick={onClick} className={cn('flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-3.5 shadow-sm', onClick && 'cursor-pointer transition hover:border-primary/50')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 truncate text-xs font-medium text-muted-fg">
          {label}
          {hint && <InfoTip text={hint} />}
        </span>
        {icon && <span className="text-muted-fg">{icon}</span>}
      </div>
      <div className={cn('num truncate text-xl font-bold tracking-tight', tone && toneText[tone])}>{value}</div>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-1.5 truncate text-xs text-muted-fg">
          {trend !== undefined && trend !== null && trend !== 0 && (
            <span className={cn('inline-flex items-center font-semibold', trend > 0 ? 'text-success' : 'text-danger')}>
              {trend > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            </span>
          )}
          {sub}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- Tabs
export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { id: T; label: React.ReactNode; badge?: React.ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('scroll-thin flex gap-1 overflow-x-auto rounded-lg bg-muted p-1', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn('flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition', value === it.id ? 'bg-card text-fg shadow-sm' : 'text-muted-fg hover:text-fg')}
        >
          {it.label}
          {it.badge}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------- Sortierbare Tabelle
export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sort?: (row: T) => number | string;
  className?: string;
  align?: 'right' | 'left' | 'center';
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, initialSort, empty, selectedKey, pageSize }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; initialSort?: { key: string; dir: 1 | -1 }; empty?: React.ReactNode; selectedKey?: string | null; pageSize?: number }) {
  const [sort, setSort] = React.useState(initialSort ?? null);
  const [page, setPage] = React.useState(0);
  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sort!(a);
      const vb = col.sort!(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [rows, sort, columns]);
  const pages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visible = pageSize ? sorted.slice(page * pageSize, page * pageSize + pageSize) : sorted;
  React.useEffect(() => {
    if (page >= pages) setPage(0);
  }, [pages, page]);
  if (!rows.length) return <div className="px-4 py-8 text-center text-sm text-muted-fg">{empty ?? 'Keine Einträge'}</div>;
  return (
    <div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {columns.map((c) => (
                <th key={c.key} className={cn('whitespace-nowrap px-3 py-2 text-xs font-semibold text-muted-fg', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}>
                  {c.sort ? (
                    <button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => setSort((p) => ({ key: c.key, dir: p?.key === c.key ? ((p.dir * -1) as 1 | -1) : -1 }))}>
                      {c.header}
                      {sort?.key === c.key ? sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ChevronsUpDown size={11} className="opacity-40" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const k = rowKey(r);
              return (
                <tr key={k} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn('border-b border-border/60 last:border-0', onRowClick && 'cursor-pointer hover:bg-muted/50', selectedKey === k && 'bg-primary/5')}>
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-3 py-2 align-middle', c.align === 'right' && 'num text-right', c.align === 'center' && 'text-center', c.className)}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageSize && pages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2 text-xs text-muted-fg">
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Zurück
          </Button>
          Seite {page + 1} / {pages}
          <Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
            Weiter
          </Button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- Formular
export const Field = ({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <label className={cn('flex flex-col gap-1', className)}>
    <span className="text-xs font-medium text-muted-fg">{label}</span>
    {children}
    {hint && <span className="text-[11px] text-muted-fg">{hint}</span>}
  </label>
);

/** Euro-Eingabe; Wert in Cent. */
export function EuroInput({ value, onChange, min, max, step = 1, ...p }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; id?: string; 'aria-label'?: string }) {
  const [txt, setTxt] = React.useState(String(Math.round(value / 100)));
  React.useEffect(() => setTxt(String(Math.round(value / 100))), [value]);
  return (
    <div className="relative">
      <input
        {...p}
        className="input num pr-8 text-right"
        inputMode="decimal"
        value={txt}
        onChange={(e) => {
          setTxt(e.target.value);
          const v = Number(e.target.value.replace(/\./g, '').replace(',', '.'));
          if (Number.isFinite(v)) onChange(Math.round(v * 100));
        }}
        onBlur={() => {
          let v = Math.round(value / 100 / step) * step;
          if (min !== undefined) v = Math.max(min / 100, v);
          if (max !== undefined) v = Math.min(max / 100, v);
          onChange(Math.round(v * 100));
          setTxt(String(v));
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-fg">€</span>
    </div>
  );
}

export const Select = ({ value, onChange, options, className, ...p }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; disabled?: boolean }[]; className?: string; 'aria-label'?: string }) => (
  <select {...p} className={cn('input pr-8', className)} value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((o) => (
      <option key={o.value} value={o.value} disabled={o.disabled}>
        {o.label}
      </option>
    ))}
  </select>
);

export const Empty = ({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
    {icon && <div className="text-muted-fg/60">{icon}</div>}
    <div className="text-sm font-semibold">{title}</div>
    {text && <div className="max-w-sm text-xs text-muted-fg">{text}</div>}
    {action}
  </div>
);

export const SectionTitle = ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
  <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="text-lg font-bold tracking-tight">{children}</h2>
    {actions}
  </div>
);

export const KeyValue = ({ items, className }: { items: [React.ReactNode, React.ReactNode][]; className?: string }) => (
  <dl className={cn('grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 text-sm', className)}>
    {items.map(([k, v], i) => (
      <React.Fragment key={i}>
        <dt className="text-muted-fg">{k}</dt>
        <dd className="num max-w-[16rem] text-right font-medium">{v}</dd>
      </React.Fragment>
    ))}
  </dl>
);
