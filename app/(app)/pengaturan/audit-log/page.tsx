'use client';
import { useState } from 'react';
import { Badge, Card, ErrorBox, PageHeader, Pagination, Table } from '@/components/ui';
import type { Paged } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';

type Log = { id: number; action: string; entity: string; entityId: number | null; data: Record<string, unknown> | null; createdAt: string; userName: string | null };
const tone = (a: string) => (a === 'delete' ? 'red' : a === 'create' ? 'green' : a === 'submit_ceisa' ? 'blue' : a === 'update' ? 'amber' : 'gray');

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useFetch<Paged<Log>>(`/audit-logs?page=${page}&pageSize=25`);
  return (
    <>
      <PageHeader title="Audit Log" desc="Jejak aktivitas pengguna untuk keperluan pemeriksaan." />
      <Card>
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<Log> loading={loading} rows={data?.data ?? []} columns={[
            { key: 'createdAt', label: 'Waktu', render: (r) => <span className="whitespace-nowrap">{dateTime(r.createdAt)}</span> },
            { key: 'userName', label: 'Pengguna', render: (r) => r.userName ?? 'sistem' },
            { key: 'action', label: 'Aksi', render: (r) => <Badge tone={tone(r.action)}>{r.action}</Badge> },
            { key: 'entity', label: 'Objek', render: (r) => <span className="font-mono text-xs">{r.entity}{r.entityId ? ` #${r.entityId}` : ''}</span> },
            { key: 'data', label: 'Detail', render: (r) => <span className="font-mono text-xs text-slate-500">{r.data ? Object.entries(r.data).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}</span> },
          ]} />
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
