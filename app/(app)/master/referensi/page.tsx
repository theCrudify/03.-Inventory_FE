'use client';
import { useState } from 'react';
import { CrudPage, type FieldDef } from '@/components/crud-page';
import { Tabs } from '@/components/ui';
import { num } from '@/lib/format';
import { useMeta, type RefRow } from '@/lib/meta';

type TypeMeta = { editable?: boolean; fields?: { name: string; label: string; type?: 'number' | 'text' }[] };

/** Tabs, editability and extra columns all come from the `tipe_referensi` registry in the database. */
export default function ReferensiPage() {
  const meta = useMeta();
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
        desc={tm.editable ? 'Data referensi kepabeanan. Hanya admin yang dapat mengubah.' : 'Dikelola sistem (dipakai aturan aplikasi), hanya dapat dilihat.'}
        adminOnly readOnly={!tm.editable}
        path={`/refs/${type}`}
        columns={[
          { key: 'code', label: 'Kode', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: 'name', label: 'Uraian' },
          ...extra.map((m) => ({ key: m.name, label: m.label, align: 'right' as const, render: (r: RefRow) => num((r.meta as Record<string, number>)?.[m.name], 2) })),
        ]}
        fields={[{ name: 'code', label: 'Kode', required: true }, { name: 'name', label: 'Uraian', required: true, full: true }, ...extra]}
        fromRow={(r) => ({ ...r, ...r.meta })}
        // Keep meta keys the form doesn't edit (e.g. flags) intact.
        toBody={(f, row) => ({ code: f.code, name: f.name, meta: { ...(row?.meta ?? {}), ...Object.fromEntries(extra.map((m) => [m.name, Number(f[m.name])])) } })}
      />
    </>
  );
}
