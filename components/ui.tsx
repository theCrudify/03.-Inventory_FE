'use client';
import {
  AlertCircle, ArrowDown, ArrowRight, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown,
  CalendarDays, CheckCircle2, Inbox, Loader2, RotateCcw, Search, SlidersHorizontal, X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePrefs } from '@/lib/prefs';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

/* =========================================================================
   BUTTON
   ========================================================================= */
export type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  href?: string;
};

const btnCls = (variant: BtnProps['variant'] = 'primary', size: BtnProps['size'] = 'md') => cx(
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap select-none cursor-pointer',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px',
  'disabled:opacity-50 disabled:pointer-events-none',
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20',
  size === 'xs' && 'h-7 px-2 text-xs [&_svg]:size-3.5',
  size === 'sm' && 'h-8 px-2.5 text-[13px] [&_svg]:size-3.5',
  size === 'md' && 'h-9 px-3.5 text-[13px] [&_svg]:size-4',
  size === 'lg' && 'h-10 px-4 text-sm [&_svg]:size-4',
  variant === 'primary' && 'bg-teal-600 text-white shadow-btn hover:bg-teal-700 [box-shadow:inset_0_1px_0_rgb(255_255_255/0.12),var(--shadow-btn)] dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400',
  variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 shadow-btn hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  variant === 'outline' && 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60',
  variant === 'danger' && 'bg-red-600 text-white shadow-btn hover:bg-red-700',
  variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
);

export function Button({ variant, size, loading, href, className, children, ...p }: BtnProps) {
  if (href) return <Link href={href} className={cx(btnCls(variant, size), className)}>{children}</Link>;
  return (
    <button {...p} disabled={p.disabled || loading} className={cx(btnCls(variant, size), className)}>
      {loading && <Loader2 className="animate-spin" />}{children}
    </button>
  );
}

/* =========================================================================
   FORM CONTROLS
   ========================================================================= */
const inputCls = cx(
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 shadow-btn',
  'placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150',
  'hover:border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10',
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
  'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-700 dark:focus:border-teal-400 dark:disabled:bg-slate-900/50',
);

export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={cx(inputCls, className)} />
);

export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(inputCls, 'h-auto min-h-20 py-2 leading-relaxed', className)} />
);

export function Select({
  className, options, placeholder, ...p
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
  return (
    <div className="relative w-full">
      <select {...p} className={cx(inputCls, 'cursor-pointer appearance-none pr-8', !p.value && placeholder !== undefined && 'text-slate-500', className)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function SearchInput({
  value, onChange, onClear, placeholder, searching, className, 'aria-label': ariaLabel,
}: {
  value: string; onChange: (v: string) => void; onClear?: () => void; placeholder?: string; searching?: boolean; className?: string; 'aria-label'?: string;
}) {
  const { t } = usePrefs();
  return (
    <div className={cx('relative flex w-full items-center', className)}>
      <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" />
      <Input
        aria-label={ariaLabel ?? t('common.search')}
        className="pl-9 pr-8"
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {searching ? (
        <Loader2 className="pointer-events-none absolute right-2.5 size-4 animate-spin text-teal-600" />
      ) : value ? (
        <button
          type="button"
          onClick={() => { onChange(''); onClear?.(); }}
          aria-label={t('common.clear')}
          className="absolute right-2 grid size-5 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function Field({
  label, index, error, hint, children, className, required,
}: {
  label: string; index?: number | string; error?: string; hint?: string; children: React.ReactNode; className?: string; required?: boolean;
}) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300">
        {index !== undefined && (
          <span className="font-mono text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500">{index}</span>
        )}
        <span>{label}{required && <span className="ml-0.5 text-red-500">*</span>}</span>
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"><AlertCircle className="size-3.5" />{error}</p>
      ) : hint ? (
        <p className="text-xs leading-normal text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* =========================================================================
   DATES — formatted per UI language (native inputs follow the OS locale,
   which showed mm/dd/yyyy and clashed with the rest of the app).
   ========================================================================= */
const fmtDate = (v: string, lang: string) =>
  new Date(`${v}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

type Picker = HTMLInputElement & { showPicker?: () => void };
const openPicker = (el: Picker | null) => { if (!el) return; try { el.showPicker ? el.showPicker() : el.focus(); } catch { el.focus(); } };

export function DateField({
  value, onChange, min, max, placeholder, className, 'aria-label': ariaLabel,
}: {
  value: string; onChange: (v: string) => void; min?: string; max?: string; placeholder?: string; className?: string; 'aria-label'?: string;
}) {
  const { lang } = usePrefs();
  const ref = useRef<Picker>(null);
  return (
    <div className={cx('relative', className)}>
      <button type="button" aria-label={ariaLabel} onClick={() => openPicker(ref.current)} className={cx(inputCls, 'flex items-center gap-2 text-left')}>
        <CalendarDays className="size-4 shrink-0 text-slate-400" />
        <span className={cx('truncate tabular-nums', !value && 'text-slate-400')}>{value ? fmtDate(value, lang) : placeholder ?? '—'}</span>
      </button>
      <input ref={ref} type="date" tabIndex={-1} aria-hidden value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className="date-native pointer-events-none absolute inset-0 opacity-0" />
    </div>
  );
}

/* =========================================================================
   FILTER BAR & DATE RANGE
   ========================================================================= */
export function FilterDateRange({
  from, to, onFromChange, onToChange, fromLabel, toLabel, maxDate, minDate, className,
}: {
  from: string; to: string; onFromChange: (val: string) => void; onToChange: (val: string) => void;
  fromLabel?: string; toLabel?: string; maxDate?: string; minDate?: string; className?: string;
}) {
  const { t, lang } = usePrefs();
  const fromRef = useRef<Picker>(null);
  const toRef = useRef<Picker>(null);

  // Range can never be inverted: moving one end past the other drags it along.
  const setFrom = (v: string) => { onFromChange(v); if (v && to && v > to) onToChange(v); };
  const setTo = (v: string) => { onToChange(v); if (v && from && v < from) onFromChange(v); };
  const fromMax = [to, maxDate].filter(Boolean).sort()[0] || undefined;
  const toMin = [from, minDate].filter(Boolean).sort().reverse()[0] || undefined;

  const part = (val: string, label: string, ref: React.RefObject<Picker | null>) => (
    <button
      type="button"
      onClick={() => openPicker(ref.current)}
      aria-label={label}
      className={cx('h-full rounded-md px-2 text-[13px] tabular-nums transition-colors hover:bg-slate-100 dark:hover:bg-slate-800', val ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400')}
    >
      {val ? fmtDate(val, lang) : label}
    </button>
  );

  return (
    <div className={cx('relative inline-flex h-9 items-center gap-0.5 rounded-lg border border-slate-200 bg-white pl-2.5 pr-1 shadow-btn transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700', className)}>
      <CalendarDays className="mr-0.5 size-4 shrink-0 text-slate-400" />
      <span className="relative h-7">{part(from, fromLabel ?? t('report.from'), fromRef)}
        <input ref={fromRef} type="date" tabIndex={-1} aria-hidden value={from} min={minDate} max={fromMax} onChange={(e) => setFrom(e.target.value)} className="date-native pointer-events-none absolute inset-0 opacity-0" />
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
      <span className="relative h-7">{part(to, toLabel ?? t('report.to'), toRef)}
        <input ref={toRef} type="date" tabIndex={-1} aria-hidden value={to} min={toMin} max={maxDate} onChange={(e) => setTo(e.target.value)} className="date-native pointer-events-none absolute inset-0 opacity-0" />
      </span>
    </div>
  );
}

export function FilterBar({
  search, filters, actions, hasActiveFilters, activeFilterCount, onReset, className,
}: {
  search?: React.ReactNode; filters?: React.ReactNode; actions?: React.ReactNode;
  hasActiveFilters?: boolean; activeFilterCount?: number; onReset?: () => void; className?: string;
}) {
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const reset = hasActiveFilters && onReset && (
    <Button type="button" variant="ghost" size="sm" onClick={onReset} className="text-slate-500">
      <RotateCcw />{t('common.reset')}
    </Button>
  );

  return (
    <div className={cx('border-b border-slate-200/70 px-4 py-3 dark:border-slate-800', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {search && <div className="w-full min-w-0 sm:w-72 lg:w-80">{search}</div>}
        {filters && <div className="hidden flex-wrap items-center gap-2 md:flex">{filters}</div>}
        {filters && (
          <Button type="button" variant="secondary" size="md" onClick={() => setOpen((o) => !o)} className="md:hidden">
            <SlidersHorizontal />{t('common.filter')}
            {activeFilterCount ? <span className="grid size-4.5 place-items-center rounded-full bg-teal-600 text-[10px] font-semibold text-white">{activeFilterCount}</span> : null}
          </Button>
        )}
        {reset}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {filters && open && (
        <div className="anim-fade mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 md:hidden dark:border-slate-800 [&>*]:w-full">
          {filters}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   CONTAINERS
   ========================================================================= */
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p} className={cx('overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900', className)} />
);

export const CardHeader = ({
  title, desc, action, index,
}: {
  title: string; desc?: string; action?: React.ReactNode; index?: number | string;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-3.5 dark:border-slate-800">
    <div className="flex min-w-0 items-center gap-2.5">
      {index !== undefined && (
        <span className="grid h-6 min-w-6 place-items-center rounded-md bg-slate-100 px-1 font-mono text-[11px] font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
      </div>
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

const statTone = {
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
};

export function Stat({
  label, value, sub, icon, tone = 'gray', href,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; tone?: keyof typeof statTone; href?: string;
}) {
  const body = (
    <Card className={cx('p-4', href && 'transition-colors hover:border-slate-300 dark:hover:border-slate-700')}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4', statTone[tone])}>{icon}</span>}
      </div>
      <div className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-slate-900 dark:text-slate-50">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

/* =========================================================================
   BADGE & PAGE HEADER
   ========================================================================= */
const tones = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-400/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-400/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20',
  red: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-400/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-400/20',
};

export function Badge({
  tone = 'gray', children, pulse, dot,
}: {
  tone?: keyof typeof tones; children: React.ReactNode; pulse?: boolean; dot?: boolean;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>
      {(pulse || dot) && <span className={cx('size-1.5 rounded-full bg-current', pulse && 'animate-pulse')} />}
      {children}
    </span>
  );
}

export function PageHeader({
  title, desc, actions, back,
}: {
  title: string; desc?: React.ReactNode; actions?: React.ReactNode; back?: string;
}) {
  const { t } = usePrefs();
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back} className="group mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />{t('common.back')}
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-[22px] dark:text-slate-50">{title}</h1>
        {desc && <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* =========================================================================
   LOADING STATES
   ========================================================================= */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cx('skeleton rounded-md bg-slate-200/70 dark:bg-slate-800', className)} />
);

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  const { t } = usePrefs();
  return (
    <div aria-busy="true" aria-label={t('common.preparingData')}>
      <div className="flex h-10 items-center gap-6 border-b border-slate-200/70 bg-slate-50/70 px-4 dark:border-slate-800 dark:bg-slate-900/60">
        {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className={cx('h-2.5', c === 0 ? 'w-5' : 'w-20')} />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex h-11 items-center gap-6 border-b border-slate-100 px-4 last:border-0 dark:border-slate-800/70">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cx('h-3', c === 0 ? 'w-5' : c % 3 === 1 ? 'w-40' : 'w-24')} />
          ))}
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
        <Loader2 className="size-3.5 animate-spin" />{t('common.preparingData')}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="space-y-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-80" /></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-14" /><Skeleton className="h-3 w-28" /></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><Skeleton className="mb-6 h-4 w-52" /><Skeleton className="h-56 w-full" /></Card>
        <Card className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</Card>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="space-y-2"><Skeleton className="h-3.5 w-16" /><Skeleton className="h-6 w-64" /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-5">
              <Skeleton className="h-4 w-44" />
              <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-9 w-full rounded-lg" />)}</div>
            </Card>
          ))}
        </div>
        <Card className="space-y-3 p-5"><Skeleton className="h-4 w-28" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</Card>
      </div>
    </div>
  );
}

export function PageShellSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh" aria-busy="true">
      <aside className="hidden w-60 flex-col gap-2 p-3 lg:flex">
        <div className="mb-4 flex items-center gap-2.5 px-1"><Skeleton className="size-8 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div></div>
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-7 w-full rounded-lg" />)}
      </aside>
      <div className="flex flex-1 flex-col lg:py-2 lg:pr-2">
        <div className="flex flex-1 flex-col rounded-none border-slate-200/80 bg-white lg:rounded-xl lg:border dark:border-slate-800 dark:bg-slate-950">
          <header className="flex h-14 items-center gap-2 border-b border-slate-200/70 px-6 text-[13px] text-slate-500 dark:border-slate-800">
            <Loader2 className="size-4 animate-spin text-teal-600" />{label ?? 'Menyiapkan data…'}
          </header>
          <main className="p-6"><DashboardSkeleton /></main>
        </div>
      </div>
    </div>
  );
}

export const Spinner = ({ label }: { label?: string }) => {
  const { t } = usePrefs();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-500">
      <Loader2 className="size-4 animate-spin text-teal-600" />{label ?? t('common.loading')}
    </div>
  );
};

export const Empty = ({ text }: { text?: string }) => {
  const { t } = usePrefs();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        <Inbox className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">{text ?? t('common.noData')}</p>
    </div>
  );
};

export const ErrorBox = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
    <AlertCircle className="mt-px size-4 shrink-0" /><span>{text}</span>
  </div>
);

/* =========================================================================
   TABLE
   ========================================================================= */
export type Column<T> = {
  key: string;
  label: string;
  render?: (r: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'right' | 'center';
  sortable?: boolean;
  sortKey?: string;
};

export function Table<T extends { id: number | string }>({
  columns, rows, onRowClick, loading, emptyText, sortBy, sortDir, onSort, showIndex = true, rowNumberOffset = 0,
}: {
  columns: Column<T>[]; rows: T[]; onRowClick?: (r: T) => void; loading?: boolean; emptyText?: string;
  sortBy?: string; sortDir?: 'asc' | 'desc'; onSort?: (key: string) => void; showIndex?: boolean; rowNumberOffset?: number;
}) {
  const { t } = usePrefs();
  const colCount = columns.length + (showIndex ? 1 : 0);
  if (loading && !rows.length) return <TableSkeleton cols={colCount} />;
  if (!rows.length) return <Empty text={emptyText} />;
  const alignOf = (c: Column<T>) => c.align ?? (c.className?.includes('text-center') ? 'center' : undefined);

  return (
    <div className="relative overflow-x-auto">
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-teal-100 dark:bg-teal-950" aria-label={t('common.updating')}>
          <div className="animate-progress h-full rounded-full bg-teal-500" />
        </div>
      )}
      <table className={cx('w-full border-collapse text-[13px] transition-opacity', loading && 'opacity-60')}>
        <thead>
          <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
            {showIndex && <th className="w-12 py-2.5 pl-4 pr-2 text-left text-xs font-medium text-slate-400">{t('common.no')}</th>}
            {columns.map((c) => {
              const sKey = c.sortKey ?? c.key;
              const canSort = !!onSort && (c.sortable || !!c.sortKey);
              const isSorted = canSort && sortBy === sKey;
              const al = alignOf(c);
              return (
                <th
                  key={c.key}
                  aria-sort={isSorted ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined}
                  className={cx('whitespace-nowrap px-3 py-2.5 text-xs font-medium text-slate-500 last:pr-4 dark:text-slate-400', al === 'right' ? 'text-right' : al === 'center' ? 'text-center' : 'text-left', c.className)}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(sKey)}
                      title={`${t('common.sortBy')} ${c.label}`}
                      className={cx(
                        'group -mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                        isSorted && 'text-slate-900 dark:text-slate-100',
                      )}
                    >
                      <span>{c.label}</span>
                      {isSorted
                        ? (sortDir === 'desc' ? <ArrowDown className="size-3.5 text-teal-600 dark:text-teal-400" /> : <ArrowUp className="size-3.5 text-teal-600 dark:text-teal-400" />)
                        : <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />}
                    </button>
                  ) : c.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.id}
              onClick={onRowClick && (() => onRowClick(r))}
              className={cx(
                'border-b border-slate-100 text-slate-700 transition-colors last:border-0 dark:border-slate-800/70 dark:text-slate-300',
                onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30',
              )}
            >
              {showIndex && <td className="py-2.5 pl-4 pr-2 text-xs tabular-nums text-slate-400 dark:text-slate-500">{rowNumberOffset + idx + 1}</td>}
              {columns.map((c) => {
                const al = alignOf(c);
                return (
                  <td key={c.key} className={cx('px-3 py-2.5 last:pr-4', al === 'right' && 'text-right tabular-nums', al === 'center' && 'text-center', c.className)}>
                    {c.render ? c.render(r, idx) : String((r as Record<string, unknown>)[c.key] ?? '–')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================================
   PAGINATION
   ========================================================================= */
export function Pagination({
  page, pageSize, total, onPage, onPageSize, pageSizeOptions = [10, 15, 20, 50, 100],
}: {
  page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (size: number) => void; pageSizeOptions?: number[];
}) {
  const { t } = usePrefs();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const list = (() => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const out: (number | '…')[] = [1];
    if (page > 3) out.push('…');
    for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) out.push(p);
    if (page < pages - 2) out.push('…');
    out.push(pages);
    return out;
  })();
  const pageBtn = 'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[13px] tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/70 px-4 py-3 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>
          {total ? <><span className="font-medium text-slate-700 dark:text-slate-200">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</span> {t('common.of')} <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span> {t('common.items')}</> : `0 ${t('common.items')}`}
        </span>
        {onPageSize && (
          <label className="inline-flex items-center gap-2">
            <span>{t('common.rowsPerPage')}</span>
            <span className="relative">
              <select
                value={pageSize}
                onChange={(e) => onPageSize(Number(e.target.value))}
                aria-label={t('common.rowsPerPage')}
                className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-[13px] font-medium text-slate-700 shadow-btn focus:border-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            </span>
          </label>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button type="button" className={cx(pageBtn, 'hover:bg-slate-100 dark:hover:bg-slate-800')} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('common.prev')}>
          <ChevronLeft className="size-4" />
        </button>
        {list.map((p, i) => p === '…' ? (
          <span key={`e${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cx(pageBtn, p === page
              ? 'border border-slate-200 bg-white font-semibold text-slate-900 shadow-btn dark:border-slate-700 dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')}
          >
            {p}
          </button>
        ))}
        <button type="button" className={cx(pageBtn, 'hover:bg-slate-100 dark:hover:bg-slate-800')} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={t('common.next')}>
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}

/* =========================================================================
   MODAL
   ========================================================================= */
export function Modal({
  open, onClose, title, children, footer, wide,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  const { t } = usePrefs();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px] sm:p-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('anim-pop w-full rounded-xl border border-slate-200 bg-white shadow-pop dark:border-slate-800 dark:bg-slate-900', wide ? 'max-w-4xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} aria-label={t('common.close')} className="grid size-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[calc(85vh-8rem)] overflow-y-auto px-5 pb-5 pt-1">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 rounded-b-xl border-t border-slate-200/70 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">{footer}</div>}
      </div>
    </div>
  );
}

/* =========================================================================
   TOAST
   ========================================================================= */
type T = { id: number; text: string; tone: 'ok' | 'err' };
let push: (t: T) => void = () => {};
export const toast = (text: string, tone: T['tone'] = 'ok') => push({ id: Date.now() + Math.random(), text, tone });

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    push = (t) => { setItems((s) => [...s, t]); setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 3500); };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="anim-pop flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-4 text-[13px] font-medium text-slate-800 shadow-pop dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          {t.tone === 'ok' ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-red-600" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   TABS & DEFINITION LIST
   ========================================================================= */
export function Tabs<K extends string>({
  tabs, value, onChange,
}: {
  tabs: { key: K; label: React.ReactNode }[]; value: K; onChange: (k: K) => void;
}) {
  return (
    <div className="flex gap-5 overflow-x-auto overflow-y-hidden border-b border-slate-200/80 scrollbar-none dark:border-slate-800" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-2 py-2.5 text-[13px] font-medium transition-colors',
            value === t.key
              ? 'border-teal-600 text-slate-900 dark:border-teal-400 dark:text-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const DL = ({ items }: { items: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
    {items.map(([k, v]) => (
      <div key={k} className="min-w-0">
        <dt className="text-xs text-slate-500 dark:text-slate-400">{k}</dt>
        <dd className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">{v || '–'}</dd>
      </div>
    ))}
  </dl>
);
