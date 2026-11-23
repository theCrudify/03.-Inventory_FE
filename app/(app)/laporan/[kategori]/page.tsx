'use client';
import { Download, RotateCcw } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, ErrorBox, FilterBar, FilterDateRange, PageHeader, Pagination, SearchInput, Table, toast } from '@/components/ui';
import { api, qs, type Paged } from '@/lib/api';
import { date, isoDate as iso, qty } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import { useDebouncedValue, useFetch } from '@/lib/use-fetch';

type Row = { itemId: number; code: string; name: string; uom: string; hsCode: string | null; saldoAwal: number; pemasukan: number; pengeluaran: number; penyesuaian: number; saldoAkhir: number };

export default function MutasiPage() {
  const slug = useParams<{ kategori: string }>().kategori;
  const ref = useMeta().refs('kategori_barang').find((r) => (r.meta as { slug?: string })?.slug === slug);
  if (!ref) notFound();
  const { t } = usePrefs();
  const category = ref.code;
  const cfg = ref.meta as { slug: string; report: string };
  const now = new Date();
  const defaultFrom = iso(new Date(now.getFullYear(), now.getMonth() - 5, 1));
  const defaultTo = iso(now);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 280);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [exporting, setExporting] = useState(false);

  const queryParams = { category, from, to, q: debouncedQ, sortBy, sortDir };
  const { data, error, loading } = useFetch<Paged<Row>>(`/reports/mutasi${qs({ ...queryParams, page, pageSize })}`);
  const rows = (data?.data ?? []).map((r) => ({ ...r, id: r.itemId }));

  const onSort = (key: string) => {
    setPage(1);
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await api<Row[]>(`/reports/mutasi${qs(queryParams)}`);
      const head = ['No', 'Kode Barang', 'Nama Barang', 'Satuan', 'Saldo Awal', 'Pemasukan', 'Pengeluaran', 'Penyesuaian', 'Saldo Akhir', 'Stock Opname', 'Selisih', 'Keterangan'];
      const body = all.map((r, i) => [i + 1, r.code, r.name, r.uom, r.saldoAwal, r.pemasukan, r.pengeluaran, r.penyesuaian, r.saldoAkhir, r.saldoAkhir, 0, 'Sesuai']);
      const csv = [head, ...body].map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `mutasi-${cfg.slug}-${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = !!(q || from !== defaultFrom || to !== defaultTo || sortBy !== 'code' || sortDir !== 'asc');
  const reset = () => {
    setQ(''); setFrom(defaultFrom); setTo(defaultTo);
    setPage(1); setSortBy('code'); setSortDir('asc');
  };

  const n = (v: number) => <span className={v < 0 ? 'text-red-600 dark:text-red-400' : ''}>{qty(v)}</span>;
  return (
    <>
      <PageHeader title={cfg.report} desc={t('report.desc', { from: date(from), to: date(to) })}
        actions={<Button variant="secondary" onClick={exportCsv} loading={exporting} disabled={!data?.total}><Download className="size-4" />{t('common.exportCsv')}</Button>} />
      <Card>
        <FilterBar
          search={
            <SearchInput
              placeholder={t('report.searchPlaceholder')}
              value={q}
              searching={loading && q !== debouncedQ}
              onChange={(v) => { setQ(v); setPage(1); }}
            />
          }
          filters={
            <FilterDateRange
              from={from}
              to={to}
              onFromChange={(val) => { setFrom(val); setPage(1); }}
              onToChange={(val) => { setTo(val); setPage(1); }}
              fromLabel={t('report.from')}
              toLabel={t('report.to')}
            />
          }
          hasActiveFilters={hasFilters}
          activeFilterCount={from !== defaultFrom || to !== defaultTo ? 1 : 0}
          onReset={reset}
        />
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<Row & { id: number }>
            loading={loading}
            rows={rows}
            emptyText={debouncedQ ? t('common.noSearchData') : t('common.noData')}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            rowNumberOffset={data ? (data.page - 1) * data.pageSize : 0}
            columns={[
              { key: 'code', sortable: true, label: t('report.code'), render: (r) => <span className="font-mono text-xs">{r.code}</span> },
              { key: 'name', sortable: true, label: t('report.name') },
              { key: 'uom', sortable: true, label: t('report.uom') },
              { key: 'saldoAwal', sortable: true, label: t('report.opening'), align: 'right', render: (r) => n(r.saldoAwal) },
              { key: 'pemasukan', sortable: true, label: t('report.in'), align: 'right', render: (r) => <span className="text-emerald-700 dark:text-emerald-400">{qty(r.pemasukan)}</span> },
              { key: 'pengeluaran', sortable: true, label: t('report.out'), align: 'right', render: (r) => <span className="text-amber-700 dark:text-amber-400">{qty(r.pengeluaran)}</span> },
              { key: 'penyesuaian', sortable: true, label: t('report.adj'), align: 'right', render: (r) => n(r.penyesuaian) },
              { key: 'saldoAkhir', sortable: true, label: t('report.closing'), align: 'right', render: (r) => <b>{n(r.saldoAkhir)}</b> },
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
    </>
  );
}
