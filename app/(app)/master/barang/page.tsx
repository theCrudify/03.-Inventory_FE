'use client';
import { CrudPage } from '@/components/crud-page';
import { Badge } from '@/components/ui';
import { qty } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import type { Item } from '@/lib/types';

export default function BarangPage() {
  const meta = useMeta();
  const cats = meta.options('kategori_barang', false);
  return (
    <CrudPage<Item>
      title="Barang" desc="Master barang beserta saldo terkini dari kartu stok (mutasi dokumen BC, produksi, dan penyesuaian)."
      path="/items"
      filter={{ name: 'category', label: 'Kategori', options: cats }}
      columns={[
        { key: 'code', label: 'Kode', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { key: 'name', label: 'Uraian Barang' },
        { key: 'category', label: 'Kategori', render: (r) => <Badge tone="teal">{meta.label('kategori_barang', r.category)}</Badge> },
        { key: 'hsCode', label: 'HS Code', render: (r) => <span className="font-mono text-xs">{r.hsCode ?? '-'}</span> },
        { key: 'stock', label: 'Saldo', align: 'right', render: (r) => <span className={Number(r.stock) < 0 ? 'text-red-600' : ''}>{qty(r.stock)} <span className="text-xs text-slate-400">{r.uom}</span></span> },
      ]}
      fields={[
        { name: 'code', label: 'Kode Barang', required: true },
        { name: 'category', label: 'Kategori', type: 'select', options: cats, required: true },
        { name: 'name', label: 'Uraian Barang', required: true, full: true },
        { name: 'hsCode', label: 'HS Code', type: 'select', options: meta.options('hs'), hint: 'Dari master HS Code & Tarif' },
        { name: 'uom', label: 'Satuan', type: 'select', options: meta.options('satuan'), required: true },
      ]}
    />
  );
}
