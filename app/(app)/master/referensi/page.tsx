'use client';
import { useState } from 'react';
import { CrudPage, type FieldDef } from '@/components/crud-page';
import { Tabs } from '@/components/ui';
import { num } from '@/lib/format';
import { useMeta, type RefRow } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';

type TypeMeta = { editable?: boolean; fields?: { name: string; label: string; type?: 'number' | 'text' }[] };

/** Tabs, editability and extra columns all come from the `tipe_referensi` registry in the database. */
export default function ReferensiPage() {
  const meta = useMeta();
  const { t: tr } = usePrefs();
  const types = meta.refs('tipe_referensi');
  const [type, setType] = useState(types[0]?.code ?? '');
  const t = types.find((x) => x.code === type);
  const tm = (t?.meta ?? {}) as TypeMeta;
  const extra: FieldDef[] = (tm.fields ?? []).map((f) => ({ name: f.name, label: f.label, type: f.type ?? 'number', required: true }));
  return (
    <>
      <div className="mb-4"><Tabs tabs={types.map((x) => ({ key: x.code, label: x.name }))} value={type} onChange={setType} /></div>
      <CrudPage<RefRow>
        key={type}
        title={t?.name ?? type}
        desc={tm.editable ? tr('refs.editableDesc') : tr('refs.readonlyDesc')}
        adminOnly readOnly={!tm.editable}
        path={`/refs/${type}`}
        defaultSort={{ key: 'code', dir: 'asc' }}
        columns={[
          { key: 'code', sortable: true, label: tr('refs.code'), render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: 'name', sortable: true, label: tr('refs.name') },
          ...extra.map((m) => ({ key: m.name, label: m.label, align: 'right' as const, render: (r: RefRow) => num((r.meta as Record<string, number>)?.[m.name], 2) })),
        ]}
        fields={[{ name: 'code', label: tr('refs.code'), required: true }, { name: 'name', label: tr('refs.name'), required: true, full: true }, ...extra]}
        fromRow={(r) => ({ ...r, ...r.meta })}
        toBody={(f, row) => ({ code: f.code, name: f.name, meta: { ...(row?.meta ?? {}), ...Object.fromEntries(extra.map((m) => [m.name, Number(f[m.name])])) } })}
      />
    </>
  );
}
