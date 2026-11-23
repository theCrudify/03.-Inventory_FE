'use client';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, ErrorBox, Field, Input, Modal, PageHeader, Pagination, Select, Table, toast } from '@/components/ui';
import { api, ApiError, qs, type Paged } from '@/lib/api';
import { canWrite, useAuth } from '@/lib/auth';
import { date, money, num, today } from '@/lib/format';
import type { TradeDoc } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';
import { useMeta } from '@/lib/meta';
import { useItems, usePartners } from '@/lib/use-options';

type Line = { itemId: string; qty: string; unitPrice: string };

export default function TradePage() {
  const meta = useMeta();
  const ref = meta.find('jenis_sumber', useParams<{ kind: string }>().kind);
  if (!ref) notFound();
  const m = ref.meta as { partnerKind: string; description: string; documentType?: string };
  const cfg = { kind: ref.code as TradeDoc['kind'], title: ref.name, desc: m.description, partner: m.partnerKind, partnerLabel: meta.label('jenis_mitra', m.partnerKind) };
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const { data, error, loading, reload } = useFetch<Paged<TradeDoc>>(`/trade-docs${qs({ kind: cfg.kind, page, pageSize: 15, q })}`);
  const partners = usePartners(cfg.partner), items = useItems();

  const [edit, setEdit] = useState<TradeDoc | 'new' | null>(null);
  const [f, setF] = useState({ number: '', date: today(), partnerId: '', currency: '', incoterm: '', lines: [] as Line[] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (t: TradeDoc | 'new') => {
    setEdit(t); setErr('');
    setF(t === 'new'
      ? { number: '', date: today(), partnerId: '', currency: meta.refs('valuta')[0]?.code ?? '', incoterm: '', lines: [{ itemId: '', qty: '', unitPrice: '' }] }
      : { number: t.number, date: t.date, partnerId: String(t.partnerId), currency: t.currency, incoterm: t.incoterm ?? '', lines: t.lines.map((l) => ({ itemId: String(l.itemId), qty: String(l.qty), unitPrice: String(l.unitPrice) })) });
  };
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const body = { kind: cfg.kind, number: f.number, date: f.date, partnerId: Number(f.partnerId), currency: f.currency, incoterm: f.incoterm || null,
      lines: f.lines.map((l) => ({ itemId: Number(l.itemId), qty: Number(l.qty), unitPrice: Number(l.unitPrice) })) };
    try {
      if (edit === 'new') await api('/trade-docs', { method: 'POST', json: body });
      else await api(`/trade-docs/${edit!.id}`, { method: 'PUT', json: body });
      toast('Dokumen disimpan'); setEdit(null); reload(true);
    } catch (e2) { const a = e2 as ApiError; setErr(a.message + (a.errors ? ': ' + a.errors.map((x) => `${x.path} ${x.message}`).join('; ') : '')); }
    finally { setBusy(false); }
  }
  async function remove(t: TradeDoc) {
    if (!confirm(`Hapus ${t.number}?`)) return;
    try { await api(`/trade-docs/${t.id}`, { method: 'DELETE' }); toast('Dihapus'); reload(true); } catch (e) { toast((e as Error).message, 'err'); }
  }
  const total = f.lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unitPrice) || 0), 0);
  const setLine = (i: number, p: Partial<Line>) => setF({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...p } : l)) });

  return (
    <>
      <PageHeader title={cfg.title} desc={cfg.desc} actions={canWrite(user) && <Button onClick={() => open('new')}><Plus className="size-4" />Tambah</Button>} />
      <Card>
        <div className="border-b border-slate-100 p-3"><Input aria-label="Cari nomor" className="max-w-xs" placeholder="Cari nomor dokumen…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<TradeDoc> loading={loading} rows={data?.data ?? []} columns={[
            { key: 'number', label: 'Nomor', render: (r) => <span className="font-mono text-xs font-medium text-slate-800">{r.number}</span> },
            { key: 'date', label: 'Tanggal', render: (r) => date(r.date) },
            { key: 'partnerName', label: cfg.partnerLabel },
            { key: 'incoterm', label: 'Incoterm' },
            { key: 'lines', label: 'Item', render: (r) => `${r.lines.length} barang` },
            { key: 'amount', label: 'Total', align: 'right', render: (r) => money(r.amount, r.currency) },
            ...(canWrite(user) ? [{ key: '_a', label: '', align: 'right' as const, render: (r: TradeDoc) => (
              <span className="inline-flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => open(r)} aria-label="Ubah"><Pencil className="size-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => remove(r)} aria-label="Hapus" className="text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /></Button>
              </span>) }] : []),
          ]} />
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      <Modal wide open={!!edit} onClose={() => setEdit(null)} title={`${edit === 'new' ? 'Tambah' : 'Ubah'} ${cfg.title}`}
        footer={<><span className="mr-auto self-center text-sm font-semibold">Total {money(total, f.currency)}</span><Button variant="secondary" onClick={() => setEdit(null)}>Batal</Button><Button type="submit" form="trade-form" loading={busy}>Simpan</Button></>}>
        <form id="trade-form" onSubmit={save} className="space-y-4">
          {err && <ErrorBox text={err} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nomor" required><Input required value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
            <Field label="Tanggal" required><Input required type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label={cfg.partnerLabel} required><Select required value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })} placeholder="Pilih" options={partners.map((p) => ({ value: p.id, label: p.name }))} /></Field>
            <Field label="Valuta"><Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} options={meta.refs('valuta').map((r) => ({ value: r.code, label: r.code }))} /></Field>
            <Field label="Incoterm"><Select value={f.incoterm} onChange={(e) => setF({ ...f, incoterm: e.target.value })} placeholder="-" options={meta.options('incoterm')} /></Field>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">Barang
              <Button type="button" variant="ghost" size="sm" onClick={() => setF({ ...f, lines: [...f.lines, { itemId: '', qty: '', unitPrice: '' }] })}><Plus className="size-3.5" />Tambah</Button></div>
            {f.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_7rem_6rem_auto] items-center gap-2">
                <Select aria-label={`Barang ${i + 1}`} required value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })} placeholder="Pilih barang" options={items.map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))} />
                <Input aria-label={`Jumlah ${i + 1}`} required type="number" step="any" min="0" placeholder="Jumlah" className="text-right" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                <Input aria-label={`Harga ${i + 1}`} required type="number" step="any" min="0" placeholder="Harga" className="text-right" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
                <span className="text-right text-xs tabular-nums text-slate-600">{num(Number(l.qty) * Number(l.unitPrice) || 0, 2)}</span>
                <Button type="button" variant="ghost" disabled={f.lines.length === 1} onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })} aria-label="Hapus barang"><Trash2 className="size-4 text-red-500" /></Button>
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </>
  );
}
