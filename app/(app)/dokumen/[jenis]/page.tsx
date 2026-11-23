'use client';
import { Plus, Search } from 'lucide-react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, ErrorBox, Input, PageHeader, Pagination, Select, Table } from '@/components/ui';
import { qs, type Paged } from '@/lib/api';
import { canWrite, useAuth } from '@/lib/auth';
import { aju, date, money } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import type { CustomsListRow } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';

export default function DocListPage() {
  const { jenis } = useParams<{ jenis: string }>();
  const meta = useMeta();
  const cfg = meta.bcBySlug(jenis);
  if (!cfg) notFound();
  const { user } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ q: '', status: '', from: '', to: '' });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch<Paged<CustomsListRow>>(`/customs-docs${qs({ bc: cfg.code, page, pageSize: 15, ...applied })}`);
  const live = data?.data.some((d) => meta.status(d.status).inFlight);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => reload(true), 4000);
    return () => clearInterval(t);
  }, [live, reload]);

  return (
    <>
      <PageHeader title={cfg.label} desc={cfg.title}
        actions={canWrite(user) && <Button href={`/dokumen/${jenis}/baru`}><Plus className="size-4" />Buat {cfg.label}</Button>} />
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(f); }} className="flex flex-wrap items-end gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input aria-label="Cari" className="pl-9" placeholder="No. aju, no. daftar, atau mitra" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          </div>
          <Select aria-label="Status" className="w-auto" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} placeholder="Semua status" options={meta.options('status_dokumen', false)} />
          <Input aria-label="Dari tanggal" type="date" className="w-auto" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <Input aria-label="Sampai tanggal" type="date" className="w-auto" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
          <Button type="submit" variant="secondary">Terapkan</Button>
        </form>
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<CustomsListRow> loading={loading} rows={data?.data ?? []} onRowClick={(r) => router.push(`/dokumen/${jenis}/${r.id}`)} columns={[
            { key: 'ajuNumber', label: 'Nomor Aju', render: (r) => <span className="whitespace-nowrap font-mono text-xs text-slate-800">{aju(r.ajuNumber)}</span> },
            { key: 'registrationNumber', label: 'No. Daftar', render: (r) => r.registrationNumber ? <span className="font-mono text-xs">{r.registrationNumber}<span className="block text-slate-400">{date(r.registrationDate)}</span></span> : <span className="text-slate-400">-</span> },
            { key: 'partnerName', label: meta.direction(cfg.direction).partyLabel, className: 'max-w-60 truncate' },
            { key: 'totalValue', label: 'Nilai', align: 'right', render: (r) => money(r.totalValue, r.currency) },
            { key: 'status', label: 'Status', render: (r) => { const st = meta.status(r.status); return <Badge tone={st.tone} pulse={st.inFlight}>{st.label}</Badge>; } },
            { key: 'createdAt', label: 'Dibuat', render: (r) => <span className="whitespace-nowrap">{date(r.createdAt)}</span> },
          ]} />
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
