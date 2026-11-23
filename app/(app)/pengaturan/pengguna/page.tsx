'use client';
import { CrudPage } from '@/components/crud-page';
import { Badge } from '@/components/ui';
import { date } from '@/lib/format';
import { useMeta, type Tone } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { User } from '@/lib/types';

export default function PenggunaPage() {
  const meta = useMeta();
  const { t } = usePrefs();
  const roles = meta.roleOptions();
  return (
    <CrudPage<User>
      title={t('users.title')}
      desc={t('users.desc')}
      path="/users"
      adminOnly
      defaultSort={{ key: 'name', dir: 'asc' }}
      filter={{ name: 'role', label: t('users.role'), options: roles }}
      columns={[
        { key: 'name', sortable: true, label: t('users.name'), render: (r) => <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span> },
        { key: 'email', sortable: true, label: t('users.email') },
        { key: 'role', sortable: true, label: t('users.role'), render: (r) => <Badge tone={meta.role(r.role).tone as Tone}>{meta.role(r.role).label}</Badge> },
        { key: 'createdAt', sortable: true, label: t('doc.createdAt'), render: (r) => date(r.createdAt) },
      ]}
      fields={[
        { name: 'name', label: t('users.name'), required: true, full: true },
        { name: 'email', label: t('users.email'), type: 'email', required: true },
        { name: 'role', label: t('users.role'), type: 'select', options: roles, required: true },
        { name: 'password', label: t('users.password'), type: 'password', required: true, createOnly: true, hint: t('users.passwordHint'), full: true },
      ]}
    />
  );
}
