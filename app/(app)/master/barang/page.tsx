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
        { key: 'code', sortable: true, label: t('items.code'), render: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { key: 'name', sortable: true, label: t('items.name') },
        { key: 'category', sortable: true, label: t('items.category'), render: (r) => <Badge tone="teal">{meta.label('kategori_barang', r.category)}</Badge> },
        { key: 'hsCode', sortable: true, label: 'HS Code', render: (r) => <span className="font-mono text-xs">{r.hsCode ?? '-'}</span> },
        { key: 'stock', sortable: true, label: t('items.stock'), align: 'right', render: (r) => <span className={Number(r.stock) < 0 ? 'text-red-600 dark:text-red-400' : ''}>{qty(r.stock)} <span className="text-xs text-slate-400 dark:text-slate-500">{r.uom}</span></span> },
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
