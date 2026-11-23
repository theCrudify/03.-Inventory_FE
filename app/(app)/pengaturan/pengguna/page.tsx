'use client';
import { CrudPage } from '@/components/crud-page';
import { Badge } from '@/components/ui';
import { date } from '@/lib/format';
import { useMeta, type Tone } from '@/lib/meta';
import type { User } from '@/lib/types';

export default function PenggunaPage() {
  const meta = useMeta();
  const roles = meta.options('role', false);
  return (
    <CrudPage<User>
      title="Pengguna" desc="Kelola akun dan hak akses (admin, operator, viewer)." path="/users" unpaged adminOnly
      columns={[
        { key: 'name', label: 'Nama', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', render: (r) => <Badge tone={meta.metaOf<{ tone?: Tone }>('role', r.role).tone}>{meta.label('role', r.role)}</Badge> },
        { key: 'createdAt', label: 'Dibuat', render: (r) => date(r.createdAt) },
      ]}
      fields={[
        { name: 'name', label: 'Nama', required: true, full: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'role', label: 'Role', type: 'select', options: roles, required: true },
        { name: 'password', label: 'Password', type: 'password', required: true, createOnly: true, hint: 'Minimal 8 karakter', full: true },
      ]}
    />
  );
}
