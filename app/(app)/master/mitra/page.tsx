'use client';
import { CrudPage } from '@/components/crud-page';
import { Badge } from '@/components/ui';
import { useMeta } from '@/lib/meta';
import type { Partner } from '@/lib/types';

export default function MitraPage() {
  const meta = useMeta();
  const kinds = meta.options('jenis_mitra', false);
  return (
    <CrudPage<Partner>
      title="Mitra Usaha" desc={meta.refs('jenis_mitra').map((r) => r.name).join(', ')}
      path="/partners"
      filter={{ name: 'kind', label: 'Jenis', options: kinds }}
      columns={[
        { key: 'name', label: 'Nama', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
        { key: 'kind', label: 'Jenis', render: (r) => <Badge>{meta.label('jenis_mitra', r.kind)}</Badge> },
        { key: 'npwp', label: 'NPWP', render: (r) => <span className="font-mono text-xs">{r.npwp ?? '-'}</span> },
        { key: 'countryCode', label: 'Negara', render: (r) => meta.label('negara', r.countryCode) },
        { key: 'address', label: 'Alamat', className: 'max-w-xs truncate' },
      ]}
      fields={[
        { name: 'name', label: 'Nama', required: true, full: true },
        { name: 'kind', label: 'Jenis', type: 'select', options: kinds, required: true },
        { name: 'countryCode', label: 'Negara', type: 'select', options: meta.options('negara'), required: true },
        { name: 'npwp', label: 'NPWP', hint: '15/16 digit, wajib untuk mitra dalam negeri' },
        { name: 'address', label: 'Alamat', full: true },
      ]}
    />
  );
}
