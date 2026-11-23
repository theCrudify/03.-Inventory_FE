'use client';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { isAdmin, useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { useDebouncedValue, useFetch } from '@/lib/use-fetch';
import { Button, Card, ErrorBox, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, Table, toast, type Column } from './ui';

export type CodeField = {
  name: string; label: string; type?: 'text' | 'number' | 'select' | 'boolean';
  options?: { value: string; label: string }[]; required?: boolean; hint?: string; full?: boolean;
  /** Editable when creating, read-only when editing (the code is referenced by other tables). */
  lockOnEdit?: boolean;
};

type Props<T extends { code: string }> = {
  title: string; desc?: string;
  path: string;
  columns: Column<T & { id: string }>[];
  fields: CodeField[];
  onChanged?: () => void;
};

const toValue = (type: CodeField['type'], v: string) => (type === 'boolean' ? v === 'true' : type === 'number' ? Number(v || 0) : v);

/** Admin CRUD for a small master table whose primary key is `code` (roles, document_statuses). */
export function MasterCodePage<T extends { code: string }>({ title, desc, path, columns, fields, onChanged }: Props<T>) {
  const { user } = useAuth();
  const { t } = usePrefs();
  const writable = isAdmin(user);
  const { data, error, loading, reload } = useFetch<T[]>(path);

  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 200);
  const [sortBy, setSortBy] = useState('sort');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filtered = useMemo(() => {
    const tokens = debouncedQ.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = (data ?? []).map((r) => ({ ...r, id: r.code })).filter((r) => {
      if (!tokens.length) return true;
      const hay = Object.values(r).map((v) => String(v ?? '')).join(' ').toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
    const dir = sortDir === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy];
      const bv = (b as Record<string, unknown>)[sortBy];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : typeof av === 'boolean' && typeof bv === 'boolean'
          ? Number(av) - Number(bv)
          : String(av ?? '').localeCompare(String(bv ?? ''));
      return cmp !== 0 ? cmp * dir : a.code.localeCompare(b.code);
    });
    return list;
  }, [data, debouncedQ, sortBy, sortDir]);

  const pagedRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSort = (key: string) => {
    setPage(1);
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const open = (row: T | 'new') => {
    setEditing(row); setErrors({}); setFormError('');
    const src = row === 'new' ? {} : (row as Record<string, unknown>);
    setForm(Object.fromEntries(fields.map((f) => [f.name, row === 'new' ? (f.type === 'select' ? f.options?.[0]?.value ?? '' : '') : String(src[f.name] ?? '')])));
  };
  const changed = () => { reload(true); onChanged?.(); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError('');
    const body = Object.fromEntries(fields.map((f) => [f.name, toValue(f.type, form[f.name] ?? '')]));
    try {
      if (editing === 'new') await api(path, { method: 'POST', json: body });
      else await api(`${path}/${(editing as T).code}`, { method: 'PUT', json: body });
      toast(editing === 'new' ? t('common.created') : t('common.saved'));
      setEditing(null); changed();
    } catch (err) {
      const ae = err as ApiError;
      if (ae.errors) setErrors(Object.fromEntries(ae.errors.map((x) => [x.path, x.message])));
      setFormError(ae.message);
    } finally { setBusy(false); }
  }

  async function remove(row: T) {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await api(`${path}/${row.code}`, { method: 'DELETE' }); toast(t('common.deleted')); changed(); }
    catch (err) { toast((err as Error).message, 'err'); }
  }

  const cols: Column<T & { id: string }>[] = writable ? [...columns, {
    key: '_act', label: '', align: 'right', render: (r) => (
      <span className="inline-flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => open(r)} aria-label={t('common.edit')}><Pencil className="size-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => remove(r)} aria-label={t('common.delete')} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="size-3.5" /></Button>
      </span>
    ),
  }] : columns;

  const hasFilters = !!(q || sortBy !== 'sort' || sortDir !== 'asc');

  return (
    <>
      <PageHeader title={title} desc={desc} actions={writable && <Button onClick={() => open('new')}><Plus className="size-4" />{t('common.add')}</Button>} />
      <Card>
        <FilterBar
          search={
            <SearchInput
              placeholder={t('common.searchPlaceholder')}
              value={q}
              searching={q !== debouncedQ}
              onChange={(v) => { setQ(v); setPage(1); }}
            />
          }
          hasActiveFilters={hasFilters}
          onReset={() => { setQ(''); setPage(1); setSortBy('sort'); setSortDir('asc'); }}
        />
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table
            columns={cols}
            rows={pagedRows}
            loading={loading}
            emptyText={debouncedQ ? t('common.noSearchData') : t('common.noData')}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            rowNumberOffset={(page - 1) * pageSize}
          />
        )}
        {filtered.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? `${t('common.add')} ${title}` : `${t('common.edit')} ${title}`}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button><Button type="submit" form="master-code-form" loading={busy}>{t('common.save')}</Button></>}>
        <form id="master-code-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {formError && <div className="sm:col-span-2"><ErrorBox text={formError} /></div>}
          {fields.map((f, idx) => (
            <Field key={f.name} index={idx + 1} label={f.label} required={f.required} error={errors[f.name]} hint={f.hint} className={f.full ? 'sm:col-span-2' : ''}>
              {f.type === 'select'
                ? <Select value={form[f.name] ?? ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} options={f.options ?? []} required={f.required} />
                : f.type === 'boolean'
                  ? <input type="checkbox" className="size-4 rounded border-slate-300 accent-teal-700 dark:border-slate-700" checked={form[f.name] === 'true'} onChange={(e) => setForm({ ...form, [f.name]: String(e.target.checked) })} />
                  : <Input type={f.type === 'number' ? 'number' : 'text'} value={form[f.name] ?? ''} required={f.required} disabled={f.lockOnEdit && editing !== 'new'}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />}
            </Field>
          ))}
        </form>
      </Modal>
    </>
  );
}
