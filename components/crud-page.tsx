'use client';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, ApiError, qs, type Paged } from '@/lib/api';
import { canWrite, isAdmin, useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { useDebouncedValue, useFetch } from '@/lib/use-fetch';
import { Button, Card, ErrorBox, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, Table, toast, type Column } from './ui';

export type FieldDef = {
  name: string; label: string; type?: 'text' | 'number' | 'select' | 'email' | 'password';
  options?: { value: string; label: string }[]; required?: boolean; hint?: string; placeholder?: string; full?: boolean;
  /** Only shown when creating (e.g. initial password). */
  createOnly?: boolean;
};

type Props<T extends { id: number }> = {
  title: string; desc?: string; path: string; columns: Column<T>[]; fields: FieldDef[];
  filter?: { name: string; label: string; options: { value: string; label: string }[] };
  searchPlaceholder?: string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  unpaged?: boolean;
  adminOnly?: boolean;
  toBody?: (form: Record<string, string>, row: T | null) => unknown;
  readOnly?: boolean;
  fromRow?: (row: T) => Record<string, unknown>;
  extraHeader?: React.ReactNode;
};

export function CrudPage<T extends { id: number }>({
  title, desc, path, columns, fields, filter, searchPlaceholder, defaultSort, unpaged, adminOnly, readOnly, toBody, fromRow, extraHeader,
}: Props<T>) {
  const { user } = useAuth();
  const { t } = usePrefs();
  const writable = !readOnly && (adminOnly ? isAdmin(user) : canWrite(user));
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 280);
  const [f, setF] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState(defaultSort?.key ?? '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.dir ?? 'asc');

  const listPath = unpaged
    ? path
    : path + qs({
        q: debouncedQ,
        page,
        pageSize,
        ...(sortBy && { sortBy, sortDir }),
        ...(filter && { [filter.name]: f }),
      });

  const { data, error, loading, reload } = useFetch<Paged<T> | T[]>(listPath);
  const rows = (Array.isArray(data) ? data : data?.data) ?? [];
  const offset = !Array.isArray(data) && data ? (data.page - 1) * data.pageSize : 0;

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

  const resetFilters = () => {
    setQ(''); setF(''); setPage(1);
    setSortBy(defaultSort?.key ?? ''); setSortDir(defaultSort?.dir ?? 'asc');
  };

  const open = (row: T | 'new') => {
    setEditing(row);
    setErrors({}); setFormError('');
    const src = row === 'new' ? {} : fromRow ? fromRow(row) : (row as Record<string, unknown>);
    setForm(Object.fromEntries(fields.map((fd) => [fd.name, row === 'new' ? (fd.type === 'select' && fd.required ? fd.options?.[0]?.value ?? '' : '') : String(src[fd.name] ?? '')])));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError('');
    const raw = Object.fromEntries(Object.entries(form).filter(([k, v]) => !(editing !== 'new' && fields.find((x) => x.name === k)?.createOnly && !v)));
    const body = toBody ? toBody(raw, editing === 'new' ? null : editing) : Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === '' ? null : fields.find((x) => x.name === k)?.type === 'number' ? Number(v) : v]));
    try {
      if (editing === 'new') await api(path, { method: 'POST', json: body });
      else await api(`${path}/${editing!.id}`, { method: 'PUT', json: body });
      toast(editing === 'new' ? t('common.created') : t('common.saved'));
      setEditing(null);
      reload(true);
    } catch (err) {
      const ae = err as ApiError;
      if (ae.errors) setErrors(Object.fromEntries(ae.errors.map((x) => [x.path, x.message])));
      setFormError(ae.message);
    } finally { setBusy(false); }
  }

  async function remove(row: T) {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await api(`${path}/${row.id}`, { method: 'DELETE' }); toast(t('common.deleted')); reload(true); }
    catch (err) { toast((err as Error).message, 'err'); }
  }

  const cols: Column<T>[] = writable ? [...columns, {
    key: '_act', label: '', align: 'right', className: 'w-20', render: (r) => (
      <span className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={() => open(r)} aria-label={t('common.edit')}><Pencil className="size-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => remove(r)} aria-label={t('common.delete')} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="size-3.5" /></Button>
      </span>
    ),
  }] : columns;

  const visibleFields = fields.filter((fd) => !(fd.createOnly && editing !== 'new' && fd.type !== 'password'));
  const hasFilters = !!(q || f || (sortBy && sortBy !== (defaultSort?.key ?? '')));

  return (
    <>
      <PageHeader title={title} desc={desc} />
      {extraHeader}
      <Card>
        {!unpaged && (
          <FilterBar
            search={
              <SearchInput
                placeholder={searchPlaceholder ?? t('common.searchPlaceholder')}
                value={q}
                searching={loading && q !== debouncedQ}
                onChange={(v) => { setQ(v); setPage(1); }}
              />
            }
            filters={
              filter ? (
                <div className="w-full sm:w-48">
                  <Select
                    aria-label={filter.label}
                    value={f}
                    onChange={(e) => { setF(e.target.value); setPage(1); }}
                    options={filter.options}
                    placeholder={`${t('common.all')} ${filter.label.toLowerCase()}`}
                  />
                </div>
              ) : null
            }
            actions={
              writable && (
                <Button onClick={() => open('new')}>
                  <Plus className="size-4" />
                  {t('common.add')} {title}
                </Button>
              )
            }
            hasActiveFilters={hasFilters}
            activeFilterCount={f ? 1 : 0}
            onReset={resetFilters}
          />
        )}
        {error ? (
          <div className="p-4"><ErrorBox text={error} /></div>
        ) : (
          <Table
            columns={cols}
            rows={rows}
            loading={loading}
            emptyText={debouncedQ || f ? t('common.noSearchData') : t('common.noData')}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={unpaged ? undefined : onSort}
            rowNumberOffset={offset}
          />
        )}
        {data && !Array.isArray(data) && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `${t('common.add')} ${title}` : `${t('common.edit')} ${title}`}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button><Button type="submit" form="crud-form" loading={busy}>{t('common.save')}</Button></>}
      >
        <form id="crud-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {formError && <div className="sm:col-span-2"><ErrorBox text={formError} /></div>}
          {visibleFields.map((fd, idx) => (
            <Field
              key={fd.name}
              index={idx + 1}
              label={fd.label}
              required={fd.required && !(fd.createOnly && editing !== 'new')}
              error={errors[fd.name]}
              hint={fd.createOnly && editing !== 'new' ? t('users.keepEmptyHint') : fd.hint}
              className={fd.full ? 'sm:col-span-2' : ''}
            >
              {fd.type === 'select'
                ? <Select value={form[fd.name] ?? ''} onChange={(e) => setForm({ ...form, [fd.name]: e.target.value })} options={fd.options ?? []} placeholder={fd.required ? undefined : '-'} required={fd.required} />
                : <Input type={fd.type ?? 'text'} step="any" value={form[fd.name] ?? ''} placeholder={fd.placeholder}
                    required={fd.required && !(fd.createOnly && editing !== 'new')} onChange={(e) => setForm({ ...form, [fd.name]: e.target.value })} />}
            </Field>
          ))}
        </form>
      </Modal>
    </>
  );
}
