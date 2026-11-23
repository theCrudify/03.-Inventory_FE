'use client';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, ApiError, qs, type Paged } from '@/lib/api';
import { canWrite, isAdmin, useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/use-fetch';
import { Button, Card, ErrorBox, Field, Input, Modal, PageHeader, Pagination, Select, Table, toast, type Column } from './ui';

export type FieldDef = {
  name: string; label: string; type?: 'text' | 'number' | 'select' | 'email' | 'password';
  options?: { value: string; label: string }[]; required?: boolean; hint?: string; placeholder?: string; full?: boolean;
  /** Only shown when creating (e.g. initial password). */
  createOnly?: boolean;
};

type Props<T extends { id: number }> = {
  title: string; desc?: string; path: string; columns: Column<T>[]; fields: FieldDef[];
  filter?: { name: string; label: string; options: { value: string; label: string }[] };
  /** Endpoint returns a plain array instead of a paged envelope. */
  unpaged?: boolean;
  adminOnly?: boolean;
  toBody?: (form: Record<string, string>, row: T | null) => unknown;
  /** List only: no add/edit/delete regardless of role. */
  readOnly?: boolean;
  /** Flatten a row into form values (e.g. nested meta). */
  fromRow?: (row: T) => Record<string, unknown>;
  extraHeader?: React.ReactNode;
};

export function CrudPage<T extends { id: number }>({ title, desc, path, columns, fields, filter, unpaged, adminOnly, readOnly, toBody, fromRow, extraHeader }: Props<T>) {
  const { user } = useAuth();
  const writable = !readOnly && (adminOnly ? isAdmin(user) : canWrite(user));
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [f, setF] = useState('');
  const [page, setPage] = useState(1);
  const listPath = unpaged ? path : path + qs({ q: search, page, pageSize: 20, ...(filter && { [filter.name]: f }) });
  const { data, error, loading, reload } = useFetch<Paged<T> | T[]>(listPath);
  const rows = (Array.isArray(data) ? data : data?.data) ?? [];

  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

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
      toast(editing === 'new' ? 'Data berhasil ditambahkan' : 'Perubahan disimpan');
      setEditing(null);
      reload(true);
    } catch (err) {
      const ae = err as ApiError;
      if (ae.errors) setErrors(Object.fromEntries(ae.errors.map((x) => [x.path, x.message])));
      setFormError(ae.message);
    } finally { setBusy(false); }
  }

  async function remove(row: T) {
    if (!confirm('Hapus data ini? Tindakan tidak dapat dibatalkan.')) return;
    try { await api(`${path}/${row.id}`, { method: 'DELETE' }); toast('Data dihapus'); reload(true); }
    catch (err) { toast((err as Error).message, 'err'); }
  }

  const cols: Column<T>[] = writable ? [...columns, {
    key: '_act', label: '', align: 'right', render: (r) => (
      <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={() => open(r)} aria-label="Ubah"><Pencil className="size-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => remove(r)} aria-label="Hapus" className="text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /></Button>
      </span>
    ),
  }] : columns;

  return (
    <>
      <PageHeader title={title} desc={desc} actions={writable && <Button onClick={() => open('new')}><Plus className="size-4" />Tambah</Button>} />
      {extraHeader}
      <Card>
        {!unpaged && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }} className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Cari" />
            </form>
            {filter && <Select aria-label={filter.label} className="w-auto" value={f} onChange={(e) => { setF(e.target.value); setPage(1); }} options={filter.options} placeholder={`Semua ${filter.label.toLowerCase()}`} />}
          </div>
        )}
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : <Table columns={cols} rows={rows} loading={loading} />}
        {data && !Array.isArray(data) && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? `Tambah ${title}` : `Ubah ${title}`}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Batal</Button><Button type="submit" form="crud-form" loading={busy}>Simpan</Button></>}>
        <form id="crud-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {formError && <div className="sm:col-span-2"><ErrorBox text={formError} /></div>}
          {fields.filter((fd) => !(fd.createOnly && editing !== 'new' && fd.type !== 'password')).map((fd) => (
            <Field key={fd.name} label={fd.label} required={fd.required && !(fd.createOnly && editing !== 'new')} error={errors[fd.name]}
              hint={fd.createOnly && editing !== 'new' ? 'Kosongkan jika tidak diubah' : fd.hint} className={fd.full ? 'sm:col-span-2' : ''}>
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
