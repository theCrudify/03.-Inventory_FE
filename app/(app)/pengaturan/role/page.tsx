'use client';
import { MasterCodePage } from '@/components/master-code-page';
import { Badge } from '@/components/ui';
import { TONES, useMeta, type RoleRow } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';

const tones = TONES.map((t) => ({ value: t, label: t }));

/** Master table `roles`: permissions are columns, so a new role needs no code change. */
export default function RolePage() {
  const meta = useMeta();
  const { t } = usePrefs();
  return (
    <MasterCodePage<RoleRow>
      title={t('users.role')} desc={t('roles.desc')}
      path="/roles" onChanged={meta.reload}
      columns={[
        { key: 'code', sortable: true, label: t('refs.code'), className: 'w-36 whitespace-nowrap', render: (r) => <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{r.code}</span> },
        { key: 'name', sortable: true, label: t('users.name'), className: 'w-44', render: (r) => <Badge tone={r.tone}>{r.name}</Badge> },
        { key: 'canWrite', sortable: true, label: t('roles.canWrite'), className: 'w-44', render: (r) => (r.canWrite ? t('common.yes') : t('common.noBoolean')) },
        { key: 'isAdmin', sortable: true, label: t('users.role'), className: 'w-28', render: (r) => (r.isAdmin ? t('common.yes') : t('common.noBoolean')) },
        { key: 'description', sortable: true, label: t('roles.description'), className: 'min-w-[200px]' },
      ]}
      fields={[
        { name: 'code', label: t('refs.code'), required: true, lockOnEdit: true, hint: t('common.codeLockedHint') },
        { name: 'name', label: t('users.name'), required: true },
        { name: 'description', label: t('roles.description'), full: true },
        { name: 'tone', label: t('common.badgeColor'), type: 'select', options: tones, required: true },
        { name: 'sort', label: t('common.sortOrder'), type: 'number' },
        { name: 'canWrite', label: t('roles.canWriteLong'), type: 'boolean', full: true },
        { name: 'isAdmin', label: t('roles.isAdminLong'), type: 'boolean', full: true },
      ]}
    />
  );
}
