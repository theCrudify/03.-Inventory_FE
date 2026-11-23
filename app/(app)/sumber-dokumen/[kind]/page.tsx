'use client';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, ErrorBox, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, Table, toast } from '@/components/ui';
import { api, ApiError, qs, type Paged } from '@/lib/api';
import { canWrite, useAuth } from '@/lib/auth';
import { date, money, num, today } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { TradeDoc } from '@/lib/types';
import { useDebouncedValue, useFetch } from '@/lib/use-fetch';
import { useItems, usePartners } from '@/lib/use-options';

type Line = { itemId: string; qty: string; unitPrice: string };

export default function TradePage() {
  const meta = useMeta();
  const { t } = usePrefs();
  const ref = meta.find('jenis_sumber', useParams<{ kind: string }>().kind);
  if (!ref) notFound();
  const m = ref.meta as { partnerKind: string; description: string; documentType?: string };
  const cfg = { kind: ref.code as TradeDoc['kind'], title: ref.name, desc: m.description, partner: m.partnerKind, partnerLabel: meta.label('jenis_mitra', m.partnerKind) };
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 280);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { data, error, loading, reload } = useFetch<Paged<TradeDoc>>(
    `/trade-docs${qs({ kind: cfg.kind, page, pageSize, q: debouncedQ, sortBy, sortDir })}`,
  );
  const partners = usePartners(cfg.partner), items = useItems();

  const [edit, setEdit] = useState<TradeDoc | 'new' | null>(null);
  const [f, setF] = useState({ number: '', date: today(), partnerId: '', currency: '', incoterm: '', lines: [] as Line[] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onSort = (key: string) => {
    setPage(1);
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const open = (tr: TradeDoc | 'new') => {
    setEdit(tr); setErr('');
    setF(tr === 'new'
      ? { number: '', date: today(), partnerId: '', currency: meta.refs('valuta')[0]?.code ?? '', incoterm: '', lines: [{ itemId: '', qty: '', unitPrice: '' }] }
      : { number: tr.number, date: tr.date, partnerId: String(tr.partnerId), currency: tr.currency, incoterm: tr.incoterm ?? '', lines: tr.lines.map((l) => ({ itemId: String(l.itemId), qty: String(l.qty), unitPrice: String(l.unitPrice) })) });
  };
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const body = { kind: cfg.kind, number: f.number, date: f.date, partnerId: Number(f.partnerId), currency: f.currency, incoterm: f.incoterm || null,
      lines: f.lines.map((l) => ({ itemId: Number(l.itemId), qty: Number(l.qty), unitPrice: Number(l.unitPrice) })) };
    try {
      if (edit === 'new') await api('/trade-docs', { method: 'POST', json: body });
      else await api(`/trade-docs/${edit!.id}`, { method: 'PUT', json: body });
      toast(t('common.saved')); setEdit(null); reload(true);
    } catch (e2) { const a = e2 as ApiError; setErr(a.message + (a.errors ? ': ' + a.errors.map((x) => `${x.path} ${x.message}`).join('; ') : '')); }
    finally { setBusy(false); }
  }
  async function remove(tr: TradeDoc) {
    if (!confirm(`${t('common.delete')} ${tr.number}?`)) return;
    try { await api(`/trade-docs/${tr.id}`, { method: 'DELETE' }); toast(t('common.deleted')); reload(true); } catch (e) { toast((e as Error).message, 'err'); }
  }
  const total = f.lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unitPrice) || 0), 0);
  const setLine = (i: number, p: Partial<Line>) => setF({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...p } : l)) });
  const hasFilters = !!(q || sortBy !== 'date' || sortDir !== 'desc');

  return (
    <>
      <PageHeader title={cfg.title} desc={cfg.desc} actions={canWrite(user) && <Button onClick={() => open('new')}><Plus className="size-4" />{t('common.add')}</Button>} />
      <Card>
        <FilterBar
          search={
            <SearchInput
              placeholder={t('trade.searchPlaceholder')}
              value={q}
              searching={loading && q !== debouncedQ}
              onChange={(v) => { setQ(v); setPage(1); }}
            />
          }
          hasActiveFilters={hasFilters}
          onReset={() => { setQ(''); setPage(1); setSortBy('date'); setSortDir('desc'); }}
        />
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<TradeDoc>
            loading={loading}
            rows={data?.data ?? []}
            emptyText={debouncedQ ? t('common.noSearchData') : t('common.noData')}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            rowNumberOffset={data ? (data.page - 1) * data.pageSize : 0}
            columns={[
              { key: 'number', sortable: true, label: t('trade.number'), render: (r) => <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{r.number}</span> },
              { key: 'date', sortable: true, label: t('trade.date'), render: (r) => date(r.date) },
              { key: 'partnerName', sortable: true, label: cfg.partnerLabel },
              { key: 'incoterm', sortable: true, label: 'Incoterm' },
              { key: 'lines', label: t('trade.itemLines'), render: (r) => t('trade.itemsCount', { n: r.lines.length }) },
              { key: 'amount', sortable: true, label: t('common.total'), align: 'right', render: (r) => money(r.amount, r.currency) },
              ...(canWrite(user) ? [{ key: '_a', label: '', align: 'right' as const, render: (r: TradeDoc) => (
                <span className="inline-flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => open(r)} aria-label={t('common.edit')}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(r)} aria-label={t('common.delete')} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="size-3.5" /></Button>
                </span>) }] : []),
            ]}
          />
        )}
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        )}
      </Card>

      <Modal wide open={!!edit} onClose={() => setEdit(null)} title={`${edit === 'new' ? t('common.add') : t('common.edit')} ${cfg.title}`}
        footer={<><span className="mr-auto self-center text-sm font-semibold">{t('common.total')} {money(total, f.currency)}</span><Button variant="secondary" onClick={() => setEdit(null)}>{t('common.cancel')}</Button><Button type="submit" form="trade-form" loading={busy}>{t('common.save')}</Button></>}>
        <form id="trade-form" onSubmit={save} className="space-y-4">
          {err && <ErrorBox text={err} />}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">01</span>
              <span>{t('trade.secInfo')}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field index="1.1" label={t('trade.number')} required><Input required value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
              <Field index="1.2" label={t('trade.date')} required><Input required type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
              <Field index="1.3" label={cfg.partnerLabel} required><Select required value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })} placeholder={t('form.selectPartner')} options={partners.map((p) => ({ value: p.id, label: p.name }))} /></Field>
              <Field index="1.4" label={t('form.currency')}><Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} options={meta.refs('valuta').map((r) => ({ value: r.code, label: r.code }))} /></Field>
              <Field index="1.5" label={t('form.incoterm')}><Select value={f.incoterm} onChange={(e) => setF({ ...f, incoterm: e.target.value })} placeholder="-" options={meta.options('incoterm')} /></Field>
            </div>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">02</span>
                <span>{t('trade.secLines')}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setF({ ...f, lines: [...f.lines, { itemId: '', qty: '', unitPrice: '' }] })}><Plus className="size-3.5" />{t('common.add')}</Button>
            </div>
            <div className="space-y-2">
              {f.lines.map((l, i) => (
                <div key={i} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 sm:border-0 sm:bg-transparent sm:p-0 sm:grid sm:grid-cols-[2rem_1fr_7.5rem_7.5rem_6.5rem_auto] sm:items-center sm:gap-2">
                  <span className="hidden sm:block text-center font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">#{i + 1}</span>
                  <div className="space-y-1 sm:space-y-0">
                    <span className="text-[11px] font-medium text-slate-500 sm:hidden">Barang #{i + 1}</span>
                    <Select aria-label={`Barang ${i + 1}`} required value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })} placeholder={t('form.selectItem')} options={items.map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:contents mt-2 sm:mt-0">
                    <div className="space-y-1 sm:space-y-0">
                      <span className="text-[11px] font-medium text-slate-500 sm:hidden">{t('form.colQty')}</span>
                      <Input aria-label={`Jumlah ${i + 1}`} required type="number" step="any" min="0" placeholder={t('form.colQty')} className="text-right" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                    </div>
                    <div className="space-y-1 sm:space-y-0">
                      <span className="text-[11px] font-medium text-slate-500 sm:hidden">{t('form.colPrice')}</span>
                      <Input aria-label={`Harga ${i + 1}`} required type="number" step="any" min="0" placeholder={t('form.colPrice')} className="text-right" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end mt-2 sm:mt-0">
                    <span className="text-xs sm:hidden font-medium text-slate-500">Subtotal:</span>
                    <span className="text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">{num(Number(l.qty) * Number(l.unitPrice) || 0, 2)}</span>
                  </div>
                  <div className="flex justify-end pt-1 sm:pt-0">
                    <Button type="button" variant="ghost" size="sm" disabled={f.lines.length === 1} onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })} aria-label={t('common.delete')}><Trash2 className="size-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
