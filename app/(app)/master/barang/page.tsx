'use client';
import { CrudPage } from '@/components/crud-page';
import { Badge } from '@/components/ui';
import { qty } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { Item } from '@/lib/types';

export default function BarangPage() {
  const meta = useMeta();
  const { t } = usePrefs();
  const cats = meta.options('kategori_barang', false);
  return (
    <CrudPage<Item>
      title={t('items.title')}
      desc={t('items.desc')}
      path="/items"
      defaultSort={{ key: 'code', dir: 'asc' }}
      filter={{ name: 'category', label: t('items.category'), options: cats }}
      columns={[
        { key: 'code', sortable: true, label: t('items.code'), className: 'w-36 whitespace-nowrap', render: (r) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{r.code}</span> },
        { key: 'name', sortable: true, label: t('items.name'), className: 'min-w-[200px]' },
        { key: 'category', sortable: true, label: t('items.category'), className: 'w-44', render: (r) => <Badge tone="teal">{meta.label('kategori_barang', r.category)}</Badge> },
        { key: 'hsCode', sortable: true, label: 'HS Code', className: 'w-36', render: (r) => <span className="font-mono text-xs">{r.hsCode ?? '-'}</span> },
        { key: 'stock', sortable: true, label: t('items.stock'), className: 'w-36 whitespace-nowrap', align: 'right', render: (r) => <span className={Number(r.stock) < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'font-semibold text-slate-800 dark:text-slate-200'}>{qty(r.stock)} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{r.uom}</span></span> },
      ]}
      fields={[
        { name: 'code', label: `${t('items.code')}`, required: true },
        { name: 'category', label: t('items.category'), type: 'select', options: cats, required: true },
        { name: 'name', label: t('items.name'), required: true, full: true },
        { name: 'hsCode', label: 'HS Code', type: 'select', options: meta.options('hs'), hint: t('items.hsHint') },
        { name: 'uom', label: t('items.uom'), type: 'select', options: meta.options('satuan'), required: true },
      ]}
    />
  );
}
