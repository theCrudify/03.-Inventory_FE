'use client';
import { ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md'; loading?: boolean; href?: string };
const btnCls = (variant: BtnProps['variant'] = 'primary', size: BtnProps['size'] = 'md') => cx(
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 whitespace-nowrap',
  size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
  variant === 'primary' && 'bg-teal-700 text-white hover:bg-teal-800',
  variant === 'secondary' && 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
  variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
);
export function Button({ variant, size, loading, href, className, children, ...p }: BtnProps) {
  if (href) return <Link href={href} className={cx(btnCls(variant, size), className)}>{children}</Link>;
  return (
    <button {...p} disabled={p.disabled || loading} className={cx(btnCls(variant, size), className)}>
      {loading && <Loader2 className="size-4 animate-spin" />}{children}
    </button>
  );
}

const inputCls = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500';
export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, className)} />;
export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, 'h-auto min-h-16 py-2', className)} />;
export function Select({ className, options, placeholder, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
  return (
    <select {...p} className={cx(inputCls, 'pr-8', className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
export function Field({ label, error, hint, children, className, required }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cx('block space-y-1', className)}>
      <span className="text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p} className={cx('rounded-xl border border-slate-200 bg-white', className)} />;
export const CardHeader = ({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
    <div><h3 className="text-sm font-semibold text-slate-900">{title}</h3>{desc && <p className="mt-0.5 text-xs text-slate-500">{desc}</p>}</div>
    {action}
  </div>
);

const tones = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200', blue: 'bg-blue-50 text-blue-700 ring-blue-200', amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200', green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', red: 'bg-red-50 text-red-700 ring-red-200', teal: 'bg-teal-50 text-teal-800 ring-teal-200',
};
export function Badge({ tone = 'gray', children, pulse }: { tone?: keyof typeof tones; children: React.ReactNode; pulse?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', tones[tone])}>
      {pulse && <span className="size-1.5 animate-pulse rounded-full bg-current" />}{children}
    </span>
  );
}

export function PageHeader({ title, desc, actions, back }: { title: string; desc?: React.ReactNode; actions?: React.ReactNode; back?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && <Link href={back} className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700"><ChevronLeft className="size-3.5" />Kembali</Link>}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {desc && <div className="mt-1 text-sm text-slate-500">{desc}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const Spinner = ({ label = 'Memuat data…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />{label}</div>
);
export const Empty = ({ text = 'Belum ada data' }: { text?: string }) => (
  <div className="flex flex-col items-center gap-2 py-14 text-sm text-slate-400"><Inbox className="size-8 stroke-1" />{text}</div>
);
export const ErrorBox = ({ text }: { text: string }) => <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{text}</div>;

export type Column<T> = { key: string; label: string; render?: (r: T) => React.ReactNode; className?: string; align?: 'right' };
export function Table<T extends { id: number | string }>({ columns, rows, onRowClick, loading }: { columns: Column<T>[]; rows: T[]; onRowClick?: (r: T) => void; loading?: boolean }) {
  if (loading && !rows.length) return <Spinner />;
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            {columns.map((c) => <th key={c.key} className={cx('px-4 py-2.5 whitespace-nowrap', c.align === 'right' && 'text-right', c.className)}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} onClick={onRowClick && (() => onRowClick(r))} className={cx('text-slate-700', onRowClick && 'cursor-pointer hover:bg-teal-50/40')}>
              {columns.map((c) => (
                <td key={c.key} className={cx('px-4 py-2.5', c.align === 'right' && 'text-right tabular-nums', c.className)}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} dari ${total} data` : '0 data'}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Sebelumnya"><ChevronLeft className="size-4" /></Button>
        <span className="px-2">Hal {page} / {pages}</span>
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Berikutnya"><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('w-full rounded-xl bg-white shadow-xl', wide ? 'max-w-4xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Tutup"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Minimal toast: `toast('Tersimpan')` from anywhere, rendered by <Toaster/>. */
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
        <div key={t.id} className={cx('rounded-lg px-4 py-2.5 text-sm text-white shadow-lg', t.tone === 'ok' ? 'bg-slate-900' : 'bg-red-600')}>{t.text}</div>
      ))}
    </div>
  );
}

export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: React.ReactNode }[]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} onClick={() => onChange(t.key)}
          className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', value === t.key ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-700')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">{label}{icon}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

export const DL = ({ items }: { items: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
    {items.map(([k, v]) => (
      <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 font-medium text-slate-800 break-words">{v || '-'}</dd></div>
    ))}
  </dl>
);
