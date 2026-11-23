'use client';
import { MasterCodePage } from '@/components/master-code-page';
import { Badge } from '@/components/ui';
import { TONES, useMeta, type StatusRow } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { I18nKey } from '@/lib/i18n';

const tones = TONES.map((t) => ({ value: t, label: t }));

/** Master table `document_statuses`: the document lifecycle is these flags; the code never refers to a status by name. */
export default function StatusPage() {
  const meta = useMeta();
  const { t } = usePrefs();
  const flagKeys: (keyof StatusRow)[] = ['initial', 'editable', 'inFlight', 'registered', 'approved', 'rejected'];
  const FLAGS = flagKeys.map((key) => ({
    key,
    label: t(`status.${key}` as I18nKey),
    hint: t(`status.${key}Hint` as I18nKey),
  }));
  return (
    <MasterCodePage<StatusRow>
      title={t('settings.statusTitle')} desc={t('settings.statusDesc')}
      path="/document-statuses" onChanged={meta.reload}
      columns={[
        { key: 'code', sortable: true, label: t('refs.code'), className: 'w-36 whitespace-nowrap', render: (r) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{r.code}</span> },
        { key: 'name', sortable: true, label: t('users.name'), className: 'w-44', render: (r) => <Badge tone={r.tone}>{r.name}</Badge> },
        { key: 'flags', label: t('settings.statusFlags'), className: 'min-w-[240px]', render: (r) => <span className="flex flex-wrap gap-1">{FLAGS.filter((f) => r[f.key]).map((f) => <Badge key={f.key}>{f.label}</Badge>)}</span> },
      ]}
      fields={[
        { name: 'code', label: t('refs.code'), required: true, lockOnEdit: true, hint: t('common.codeLockedHint') },
        { name: 'name', label: t('users.name'), required: true },
        { name: 'tone', label: t('common.badgeColor'), type: 'select', options: tones, required: true },
        { name: 'sort', label: t('common.sortOrder'), type: 'number' },
        ...FLAGS.map((f) => ({ name: f.key, label: f.label, type: 'boolean' as const, hint: f.hint, full: true })),
      ]}
    />
  );
}
