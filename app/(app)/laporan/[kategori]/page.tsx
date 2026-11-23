'use client';
import { Download } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, ErrorBox, Field, Input, PageHeader, Table } from '@/components/ui';
import { date, isoDate as iso, qty } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import { useFetch } from '@/lib/use-fetch';

type Row = { itemId: number; code: string; name: string; uom: string; hsCode: string | null; saldoAwal: number; pemasukan: number; pengeluaran: number; penyesuaian: number; saldoAkhir: number };

export default function MutasiPage() {
  const slug = useParams<{ kategori: string }>().kategori;
  const ref = useMeta().refs('kategori_barang').find((r) => (r.meta as { slug?: string })?.slug === slug);
  if (!ref) notFound();
  const category = ref.code;
  const cfg = ref.meta as { slug: string; report: string };
  const now = new Date();
  const [range, setRange] = useState({ from: iso(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: iso(now) });
  const [applied, setApplied] = useState(range);
  const { data, error, loading } = useFetch<Row[]>(`/reports/mutasi?category=${category}&from=${applied.from}&to=${applied.to}`);
  const rows = (data ?? []).map((r) => ({ ...r, id: r.itemId }));

  function exportCsv() {
    const head = ['No', 'Kode Barang', 'Nama Barang', 'Satuan', 'Saldo Awal', 'Pemasukan', 'Pengeluaran', 'Penyesuaian', 'Saldo Akhir', 'Stock Opname', 'Selisih', 'Keterangan'];
    const body = rows.map((r, i) => [i + 1, r.code, r.name, r.uom, r.saldoAwal, r.pemasukan, r.pengeluaran, r.penyesuaian, r.saldoAkhir, r.saldoAkhir, 0, 'Sesuai']);
    const csv = [head, ...body].map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `mutasi-${cfg.slug}-${applied.from}_${applied.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const n = (v: number) => <span className={v < 0 ? 'text-red-600' : ''}>{qty(v)}</span>;
  return (
    <>
      <PageHeader title={cfg.report} desc={`Periode ${date(applied.from)} s.d. ${date(applied.to)} · dihitung dari kartu stok`}
        actions={<Button variant="secondary" onClick={exportCsv} disabled={!rows.length}><Download className="size-4" />Ekspor CSV</Button>} />
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setApplied(range); }} className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-3">
          <Field label="Dari"><Input type="date" required value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field>
          <Field label="Sampai"><Input type="date" required value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field>
          <Button type="submit" variant="secondary">Tampilkan</Button>
        </form>
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<Row & { id: number }> loading={loading} rows={rows} columns={[
            { key: 'code', label: 'Kode', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
            { key: 'name', label: 'Nama Barang' },
            { key: 'uom', label: 'Sat.' },
            { key: 'saldoAwal', label: 'Saldo Awal', align: 'right', render: (r) => n(r.saldoAwal) },
            { key: 'pemasukan', label: 'Pemasukan', align: 'right', render: (r) => <span className="text-emerald-700">{qty(r.pemasukan)}</span> },
            { key: 'pengeluaran', label: 'Pengeluaran', align: 'right', render: (r) => <span className="text-amber-700">{qty(r.pengeluaran)}</span> },
            { key: 'penyesuaian', label: 'Penyesuaian', align: 'right', render: (r) => n(r.penyesuaian) },
            { key: 'saldoAkhir', label: 'Saldo Akhir', align: 'right', render: (r) => <b>{n(r.saldoAkhir)}</b> },
          ]} />
        )}
      </Card>
    </>
  );
}
