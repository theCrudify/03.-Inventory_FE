'use client';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Filter, Inbox, Loader2, RotateCcw, Search, SlidersHorizontal, X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 whitespace-nowrap cursor-pointer select-none active:scale-[0.98]',
  size === 'xs' && 'h-6.5 px-2 text-[11px]',
  size === 'sm' && 'h-7.5 px-2.5 text-xs',
  size === 'md' && 'h-8.5 px-3 text-xs sm:text-[13px]',
  size === 'lg' && 'h-9.5 px-4 text-sm',
  variant === 'primary' && 'bg-teal-700 text-white shadow-xs hover:bg-teal-800 hover:shadow-sm dark:bg-teal-600 dark:hover:bg-teal-500',
  variant === 'secondary' && 'border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600',
  variant === 'danger' && 'bg-red-600 text-white shadow-xs hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500',
  variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
  variant === 'outline' && 'border border-slate-300/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
);

export function Button({ variant, size, loading, href, className, children, ...p }: BtnProps) {
  if (href) return <Link href={href} className={cx(btnCls(variant, size), className)}>{children}</Link>;
  return (
    <button {...p} disabled={p.disabled || loading} className={cx(btnCls(variant, size), className)}>
      {loading && <Loader2 className="size-4 animate-spin" />}{children}
    </button>
  );
}

/* =========================================================================
   FORM INPUTS
   ========================================================================= */
const inputCls = 'h-8.5 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all duration-150 hover:border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-1.5 focus:ring-teal-600/15 disabled:bg-slate-50/80 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-700 dark:focus:border-teal-500 dark:disabled:bg-slate-800/40';

export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={cx(inputCls, className)} />
);

export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(inputCls, 'h-auto min-h-16 py-2 leading-relaxed', className)} />
);

export function Select({
  className, options, placeholder, ...p
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
  return (
    <div className="relative inline-block w-full">
      <select
        {...p}
        className={cx(
          inputCls,
          'appearance-none pr-7.5 cursor-pointer font-normal',
          className,
        )}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
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
    <div className={cx('relative flex w-full items-center min-w-[200px]', className)}>
      <Search className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400 dark:text-slate-500" />
      <Input
        aria-label={ariaLabel ?? t('common.search')}
        className="w-full pl-8 pr-7 text-xs"
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {searching ? (
        <Loader2 className="pointer-events-none absolute right-2 size-3.5 animate-spin text-teal-600 dark:text-teal-400" />
      ) : value ? (
        <button
          type="button"
          onClick={() => { onChange(''); onClear?.(); }}
          aria-label={t('common.clear')}
          className="absolute right-2 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="size-3" />
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
    <div className={cx('space-y-1', className)}>
      <label className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-300">
        {index !== undefined && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-slate-100 px-1 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {index}
          </span>
        )}
        <span>{label}{required && <span className="text-red-500">*</span>}</span>
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{hint}</p>
      ) : null}
    </div>
  );
}

/* =========================================================================
   TOOLBAR & FILTER BAR (Clean, Modular, Responsive)
   ========================================================================= */
export function FilterDateRange({
  from,
  to,
  onFromChange,
  onToChange,
  fromLabel,
  toLabel,
  maxDate,
  minDate,
  className,
}: {
  from: string;
  to: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  fromLabel?: string;
  toLabel?: string;
  maxDate?: string;
  minDate?: string;
  className?: string;
}) {
  const { t } = usePrefs();

  const handleFromChange = (val: string) => {
    onFromChange(val);
    // If 'from' is picked after 'to', auto-sync 'to' so range is never inverted / backdated
    if (val && to && val > to) {
      onToChange(val);
    }
  };

  const handleToChange = (val: string) => {
    onToChange(val);
    // If 'to' is picked before 'from' (backdated), auto-sync 'from' so range remains valid
    if (val && from && val < from) {
      onFromChange(val);
    }
  };

  const fromMax = to && maxDate ? (to < maxDate ? to : maxDate) : (to || maxDate || undefined);
  const toMin = from && minDate ? (from > minDate ? from : minDate) : (from || minDate || undefined);

  return (
    <div className={cx('inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5', className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {fromLabel ?? t('report.from')}:
        </span>
        <Input
          type="date"
          aria-label={fromLabel ?? t('report.from')}
          value={from}
          min={minDate || undefined}
          max={fromMax}
          onChange={(e) => handleFromChange(e.target.value)}
          className="h-8.5 w-34 text-xs font-normal"
        />
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">—</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {toLabel ?? t('report.to')}:
        </span>
        <Input
          type="date"
          aria-label={toLabel ?? t('report.to')}
          value={to}
          min={toMin}
          max={maxDate || undefined}
          onChange={(e) => handleToChange(e.target.value)}
          className="h-8.5 w-34 text-xs font-normal"
        />
      </div>
    </div>
  );
}

export function FilterBar({
  search,
  filters,
  actions,
  hasActiveFilters,
  activeFilterCount,
  onReset,
  className,
}: {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  hasActiveFilters?: boolean;
  activeFilterCount?: number;
  onReset?: () => void;
  className?: string;
}) {
  const { t } = usePrefs();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <div className={cx('border-b border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/50', className)}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left / Center controls */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {search && (
            <div className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-sm flex-1">
              {search}
            </div>
          )}

          {/* Desktop Filters */}
          {filters && (
            <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
              {filters}
            </div>
          )}

          {/* Desktop Reset Button */}
          {hasActiveFilters && onReset && (
            <div className="hidden sm:block">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RotateCcw className="size-3.5" />
                <span>{t('common.reset')}</span>
              </Button>
            </div>
          )}

          {/* Mobile Filter Toggle Button */}
          {filters && (
            <div className="flex items-center justify-between gap-2 sm:hidden w-full">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="flex-1 justify-center"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>{t('common.filter')}</span>
                {activeFilterCount ? (
                  <span className="ml-1 rounded-full bg-teal-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>

              {hasActiveFilters && onReset && (
                <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                  <RotateCcw className="size-3.5" />
                  <span>{t('common.reset')}</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right Action buttons */}
        {actions && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Mobile Collapsible Filter Drawer */}
      {filters && mobileFilterOpen && (
        <div className="mt-2.5 grid gap-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-800 sm:hidden animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{t('common.filterOptions')}</span>
            {hasActiveFilters && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-teal-700 hover:underline dark:text-teal-400"
              >
                {t('common.resetAll')}
              </button>
            )}
          </div>
          {filters}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   CONTAINERS: CARD, CARDHEADER, STAT
   ========================================================================= */
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...p}
    className={cx(
      'overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition-colors dark:border-slate-800/80 dark:bg-slate-900',
      className,
    )}
  />
);

export const CardHeader = ({
  title, desc, action, index,
}: {
  title: string; desc?: string; action?: React.ReactNode; index?: number | string;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800/80">
    <div className="flex items-center gap-2">
      {index !== undefined && (
        <span className="inline-flex h-5 min-w-5.5 items-center justify-center rounded-md bg-teal-50 px-1 font-mono text-[11px] font-bold text-teal-800 ring-1 ring-teal-200/80 dark:bg-teal-950/70 dark:text-teal-300 dark:ring-teal-800/80">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {desc && <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</p>}
      </div>
    </div>
    {action && <div className="flex items-center gap-1.5">{action}</div>}
  </div>
);

export function Stat({
  label, value, sub, icon,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden p-3.5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        {icon && <span className="rounded-md bg-slate-50 p-1 dark:bg-slate-800/60">{icon}</span>}
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{sub}</div>}
    </Card>
  );
}

/* =========================================================================
   BADGES & PAGE HEADER
   ========================================================================= */
const tones = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200/90 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200/90 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200/90 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/90 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-800',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/90 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  red: 'bg-red-50 text-red-700 ring-red-200/90 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800',
  teal: 'bg-teal-50 text-teal-800 ring-teal-200/90 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-800',
};

export function Badge({
  tone = 'gray', children, pulse,
}: {
  tone?: keyof typeof tones; children: React.ReactNode; pulse?: boolean;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', tones[tone])}>
      {pulse && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
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
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back}
            className="group mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
          >
            <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            {t('common.back')}
          </Link>
        )}
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {desc && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
            {desc}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">{actions}</div>}
    </div>
  );
}

/* =========================================================================
   SKELETONS & LOADING INDICATORS
   ========================================================================= */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cx('animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800', className)} />
);

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  const { t } = usePrefs();
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label={t('common.preparingData')}>
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <Loader2 className="size-3.5 animate-spin text-teal-600 dark:text-teal-400" />
        <span>{t('common.preparingData')}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
            {Array.from({ length: cols }).map((_, c) => (
              <th key={c} className="px-3.5 py-2.5"><Skeleton className={cx('h-3.5', c === 0 ? 'w-6' : 'w-24')} /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/90 dark:divide-slate-800/70">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-3.5 py-2.5">
                  <Skeleton className={cx('h-3.5', c === 0 ? 'w-6' : c % 2 ? 'w-3/4' : 'w-1/2')} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-80" /></div>
        <div className="flex gap-2"><Skeleton className="h-9 w-28 rounded-lg" /><Skeleton className="h-9 w-28 rounded-lg" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-4"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-28" /></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="mb-6 h-5 w-52" />
          <div className="flex h-48 items-end gap-4">
            {[45, 72, 60, 88, 52, 76].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full animate-pulse rounded-t bg-slate-200/80 dark:bg-slate-800" style={{ height: `${h}%` }} />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <Skeleton className="mb-2 h-5 w-36" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </Card>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2"><Skeleton className="h-3.5 w-16" /><Skeleton className="h-7 w-64" /></div>
        <div className="flex gap-2"><Skeleton className="h-9 w-24 rounded-lg" /><Skeleton className="h-9 w-32 rounded-lg" /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-5">
              <Skeleton className="h-5 w-44" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-9 w-full rounded-lg" />)}
              </div>
            </Card>
          ))}
        </div>
        <Card className="space-y-3 p-5"><Skeleton className="h-5 w-28" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</Card>
      </div>
    </div>
  );
}

export function PageShellSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-950" aria-busy="true">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="mb-6 flex items-center gap-2"><Skeleton className="size-8 rounded-lg" /><div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div></div>
        <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="size-4 animate-spin text-teal-600 dark:text-teal-400" />
            <span>{label ?? 'Menyiapkan data…'}</span>
          </div>
          <Skeleton className="h-8 w-36 rounded-lg" />
        </header>
        <main className="w-full max-w-[1600px] 2xl:mx-auto flex-1 px-4 py-5 sm:px-6 lg:px-8"><DashboardSkeleton /></main>
      </div>
    </div>
  );
}

export const Spinner = ({ label }: { label?: string }) => {
  const { t } = usePrefs();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
      <Loader2 className="size-4 animate-spin text-teal-600 dark:text-teal-400" />
      {label ?? t('common.loading')}
    </div>
  );
};

export const Empty = ({ text }: { text?: string }) => {
  const { t } = usePrefs();
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
      <Inbox className="size-9 stroke-[1.25]" />
      <span>{text ?? t('common.noData')}</span>
    </div>
  );
};

export const ErrorBox = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
    {text}
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
  align?: 'right';
  sortable?: boolean;
  sortKey?: string;
};

export function Table<T extends { id: number | string }>({
  columns, rows, onRowClick, loading, emptyText,
  sortBy, sortDir, onSort,
  showIndex = true, rowNumberOffset = 0,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (r: T) => void;
  loading?: boolean;
  emptyText?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  showIndex?: boolean;
  rowNumberOffset?: number;
}) {
  const { t } = usePrefs();
  const colCount = columns.length + (showIndex ? 1 : 0);
  if (loading && !rows.length) return <TableSkeleton cols={colCount} />;
  if (!rows.length) return <Empty text={emptyText} />;

  return (
    <div className="relative overflow-x-auto">
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-teal-100 dark:bg-teal-950" aria-label={t('common.updating')}>
          <div className="animate-progress h-full rounded-full bg-teal-600 dark:bg-teal-400" />
        </div>
      )}
      <table className={cx('w-full text-xs transition-opacity duration-150', loading && 'opacity-65')}>
        <thead>
          <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            {showIndex && <th className="w-12 px-3.5 py-2.5 text-center font-medium">{t('common.no')}</th>}
            {columns.map((c) => {
              const sKey = c.sortKey ?? c.key;
              const canSort = !!onSort && (c.sortable || !!c.sortKey);
              const isSorted = canSort && sortBy === sKey;
              const isRight = c.align === 'right';
              const isCenter = c.className?.includes('text-center');
              return (
                <th key={c.key} className={cx('px-3.5 py-2.5 whitespace-nowrap', isRight && 'text-right', isCenter && 'text-center', c.className)}>
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(sKey)}
                      className={cx(
                        'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider transition-colors hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer select-none',
                        isRight ? 'ml-auto justify-end' : isCenter ? 'mx-auto justify-center' : 'justify-start',
                        isSorted && 'text-teal-700 dark:text-teal-400',
                      )}
                      title={`${t('common.sortBy')} ${c.label}`}
                    >
                      <span className="truncate">{c.label}</span>
                      <span className="shrink-0">
                        {isSorted ? (
                          sortDir === 'desc' ? (
                            <ArrowDown className="size-3.5 text-teal-700 dark:text-teal-400" />
                          ) : (
                            <ArrowUp className="size-3.5 text-teal-700 dark:text-teal-400" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/90 dark:divide-slate-800/70">
          {rows.map((r, idx) => (
            <tr
              key={r.id}
              onClick={onRowClick && (() => onRowClick(r))}
              className={cx(
                'text-slate-700 transition-colors duration-100 dark:text-slate-300',
                idx % 2 === 1 && 'bg-slate-50/30 dark:bg-slate-800/15',
                onRowClick ? 'cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-950/25' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
              )}
            >
              {showIndex && (
                <td className="px-3 py-2 text-center font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {rowNumberOffset + idx + 1}
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={cx('px-3 py-2', c.align === 'right' && 'text-right tabular-nums', c.className)}>
                  {c.render ? c.render(r, idx) : String((r as Record<string, unknown>)[c.key] ?? '-')}
                </td>
              ))}
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
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const { t } = usePrefs();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageList = (() => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    const out: (number | '...')[] = [1];
    if (page > 3) out.push('...');
    for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) out.push(p);
    if (page < pages - 2) out.push('...');
    out.push(pages);
    return out;
  })();

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100/90 px-3.5 py-2 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {total
            ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} ${t('common.of')} ${total} ${t('common.items')}`
            : `0 ${t('common.items')}`}
        </span>
        {onPageSize && (
          <label className="inline-flex items-center gap-1.5">
            <span>{t('common.rowsPerPage')}:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              aria-label={t('common.rowsPerPage')}
              className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1 self-center sm:self-auto">
        <Button variant="ghost" size="xs" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('common.prev')}>
          <ChevronLeft className="size-3.5" />
        </Button>
        {pageList.map((p, i) => p === '...' ? (
          <span key={`e-${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={cx(
              'h-6.5 min-w-6.5 rounded px-1.5 text-xs font-semibold tabular-nums transition-colors',
              p === page
                ? 'bg-teal-700 text-white shadow-xs dark:bg-teal-600'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            {p}
          </button>
        ))}
        <Button variant="ghost" size="xs" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={t('common.next')}>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
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
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs sm:p-8 animate-in fade-in duration-150"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'w-full rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900',
          wide ? 'max-w-4xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={t('common.close')}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5 max-h-[calc(85vh-8rem)] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800/80 dark:bg-slate-900/50 rounded-b-2xl">
            {footer}
          </div>
        )}
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
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={cx(
            'rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150',
            t.tone === 'ok' ? 'bg-slate-900 dark:bg-teal-700' : 'bg-red-600',
          )}
        >
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
    <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200/80 dark:border-slate-800/80" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer',
            value === t.key
              ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const DL = ({ items }: { items: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
    {items.map(([k, v]) => (
      <div key={k} className="space-y-0.5">
        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{k}</dt>
        <dd className="font-medium text-slate-800 break-words dark:text-slate-200">{v || '-'}</dd>
      </div>
    ))}
  </dl>
);
