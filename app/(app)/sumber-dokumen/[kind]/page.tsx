'use client';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, DateField, ErrorBox, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, Table, toast } from '@/components/ui';
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
      <PageHeader
        title={cfg.title}
        desc={cfg.desc}
      />
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
          actions={
            canWrite(user) && (
              <Button onClick={() => open('new')}>
                <Plus className="size-4" />
                {t('common.add')} {cfg.title}
              </Button>
            )
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
              { key: 'number', sortable: true, label: t('trade.number'), className: 'w-44 whitespace-nowrap', render: (r) => <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{r.number}</span> },
              { key: 'date', sortable: true, label: t('trade.date'), className: 'w-32 whitespace-nowrap', render: (r) => date(r.date) },
              { key: 'partnerName', sortable: true, label: cfg.partnerLabel, className: 'min-w-[200px]' },
              { key: 'incoterm', sortable: true, label: 'Incoterm', className: 'w-24 text-center' },
              { key: 'lines', label: t('trade.itemLines'), className: 'w-28 text-center', render: (r) => t('trade.itemsCount', { n: r.lines.length }) },
              { key: 'amount', sortable: true, label: t('common.total'), className: 'w-40 whitespace-nowrap', align: 'right', render: (r) => <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(r.amount, r.currency)}</span> },
              ...(canWrite(user) ? [{ key: '_a', label: '', className: 'w-20', align: 'right' as const, render: (r: TradeDoc) => (
                <span className="inline-flex items-center justify-end gap-1">
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
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t('common.cancel')}</Button><Button type="submit" form="trade-form" loading={busy}>{t('common.save')}</Button></>}>
        <form id="trade-form" onSubmit={save} className="space-y-5">
          {err && <ErrorBox text={err} />}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('trade.secInfo')}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t('trade.number')} required>
                <Input required placeholder="INV-2026-..." value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} />
              </Field>
              <Field label={t('trade.date')} required>
                <DateField value={f.date} onChange={(v) => setF({ ...f, date: v })} />
              </Field>
              <Field label={cfg.partnerLabel} required>
                <Select required value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })} placeholder={t('form.selectPartner')} options={partners.map((p) => ({ value: p.id, label: p.name }))} />
              </Field>
              <Field label={t('form.currency')}>
                <Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} options={meta.refs('valuta').map((r) => ({ value: r.code, label: r.code }))} />
              </Field>
              <Field label={t('form.incoterm')} className="sm:col-span-1 lg:col-span-2">
                <Select value={f.incoterm} onChange={(e) => setF({ ...f, incoterm: e.target.value })} placeholder="—" options={meta.options('incoterm')} />
              </Field>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('trade.secLines')}</h3>
              <Button type="button" variant="secondary" size="xs" onClick={() => setF({ ...f, lines: [...f.lines, { itemId: '', qty: '', unitPrice: '' }] })}>
                <Plus className="size-3.5" />{t('common.add')}
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200/90 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                    <th className="w-9 py-2 pl-3 text-center">#</th>
                    <th className="py-2 px-2">{t('nav.items')}</th>
                    <th className="w-28 py-2 px-2 text-right">{t('form.colQty')}</th>
                    <th className="w-32 py-2 px-2 text-right">{t('form.colPrice')}</th>
                    <th className="w-32 py-2 px-2 text-right">{t('common.total')}</th>
                    <th className="w-9 py-2 pr-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {f.lines.map((l, i) => {
                    const sub = Number(l.qty) * Number(l.unitPrice) || 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 pl-3 text-center font-mono text-[11px] text-slate-400">{i + 1}</td>
                        <td className="py-2 px-2">
                          <Select
                            required
                            value={l.itemId}
                            onChange={(e) => setLine(i, { itemId: e.target.value })}
                            placeholder={t('form.selectItem')}
                            options={items.map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            required
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            className="h-8 text-right text-xs tabular-nums"
                            value={l.qty}
                            onChange={(e) => setLine(i, { qty: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            required
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.00"
                            className="h-8 text-right text-xs tabular-nums"
                            value={l.unitPrice}
                            onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-2 text-right font-medium tabular-nums text-slate-800 dark:text-slate-200">
                          {num(sub, 2)}
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <button
                            type="button"
                            disabled={f.lines.length === 1}
                            onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })}
                            className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">{f.lines.length} {t('common.items')}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.total')}:</span>
                <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(total, f.currency)}</span>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
