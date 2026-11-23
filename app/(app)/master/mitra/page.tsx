'use client';
import { CrudPage } from '@/components/crud-page';
import { Badge } from '@/components/ui';
import { useMeta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { Partner } from '@/lib/types';

export default function MitraPage() {
  const meta = useMeta();
  const { t } = usePrefs();
  const kinds = meta.options('jenis_mitra', false);
  return (
    <CrudPage<Partner>
      title={t('partners.title')}
      desc={meta.refs('jenis_mitra').map((r) => r.name).join(', ')}
      path="/partners"
      defaultSort={{ key: 'name', dir: 'asc' }}
      filter={{ name: 'kind', label: t('partners.kind'), options: kinds }}
      columns={[
        { key: 'name', sortable: true, label: t('partners.name'), render: (r) => <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span> },
        { key: 'kind', sortable: true, label: t('partners.kind'), render: (r) => <Badge>{meta.label('jenis_mitra', r.kind)}</Badge> },
        { key: 'npwp', sortable: true, label: 'NPWP', render: (r) => <span className="font-mono text-xs">{r.npwp ?? '-'}</span> },
        { key: 'countryCode', sortable: true, label: t('partners.country'), render: (r) => meta.label('negara', r.countryCode) },
        { key: 'address', sortable: true, label: t('partners.address'), className: 'max-w-xs truncate' },
      ]}
      fields={[
        { name: 'name', label: t('partners.name'), required: true, full: true },
        { name: 'kind', label: t('partners.kind'), type: 'select', options: kinds, required: true },
        { name: 'countryCode', label: t('partners.country'), type: 'select', options: meta.options('negara'), required: true },
        { name: 'npwp', label: 'NPWP', hint: t('partners.npwpHint') },
        { name: 'address', label: t('partners.address'), full: true },
      ]}
    />
  );
}
