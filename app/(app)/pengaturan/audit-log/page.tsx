'use client';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, ErrorBox, FilterBar, PageHeader, Pagination, SearchInput, Select, Table } from '@/components/ui';
import { qs, type Paged } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { usePrefs } from '@/lib/prefs';
import { useDebouncedValue, useFetch } from '@/lib/use-fetch';

type Log = { id: number; action: string; entity: string; entityId: number | null; data: Record<string, unknown> | null; createdAt: string; userName: string | null };
const tone = (a: string) => (a === 'delete' ? 'red' : a === 'create' ? 'green' : a === 'submit_ceisa' ? 'blue' : a === 'update' ? 'amber' : 'gray');
const ACTIONS = [
  { value: 'create', label: 'create' },
  { value: 'update', label: 'update' },
  { value: 'delete', label: 'delete' },
  { value: 'submit_ceisa', label: 'submit_ceisa' },
  { value: 'login', label: 'login' },
];

export default function AuditLogPage() {
  const { t } = usePrefs();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 280);
  const [action, setAction] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data, error, loading } = useFetch<Paged<Log>>(
    `/audit-logs${qs({ page, pageSize, q: debouncedQ, action, sortBy, sortDir })}`,
  );

  const onSort = (key: string) => {
    setPage(1);
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const hasFilters = !!(q || action || sortBy !== 'createdAt' || sortDir !== 'desc');
  const reset = () => {
    setQ(''); setAction(''); setPage(1); setSortBy('createdAt'); setSortDir('desc');
  };

  return (
    <>
      <PageHeader title={t('audit.title')} desc={t('audit.desc')} />
      <Card>
        <FilterBar
          search={
            <SearchInput
              placeholder={t('audit.searchPlaceholder')}
              value={q}
              searching={loading && q !== debouncedQ}
              onChange={(v) => { setQ(v); setPage(1); }}
            />
          }
          filters={
            <div className="w-full sm:w-44">
              <Select
                aria-label={t('audit.action')}
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                placeholder={t('audit.allActions')}
                options={ACTIONS}
              />
            </div>
          }
          hasActiveFilters={hasFilters}
          activeFilterCount={action ? 1 : 0}
          onReset={reset}
        />
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<Log>
            loading={loading}
            rows={data?.data ?? []}
            emptyText={debouncedQ || action ? t('common.noSearchData') : t('common.noData')}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            rowNumberOffset={data ? (data.page - 1) * data.pageSize : 0}
            columns={[
              { key: 'createdAt', sortable: true, label: t('audit.time'), render: (r) => <span className="whitespace-nowrap">{dateTime(r.createdAt)}</span> },
              { key: 'userName', sortable: true, label: t('audit.user'), render: (r) => r.userName ?? 'sistem' },
              { key: 'action', sortable: true, label: t('audit.action'), render: (r) => <Badge tone={tone(r.action)}>{r.action}</Badge> },
              { key: 'entity', sortable: true, label: t('audit.entity'), render: (r) => <span className="font-mono text-xs">{r.entity}{r.entityId ? ` #${r.entityId}` : ''}</span> },
              { key: 'data', label: t('audit.detail'), render: (r) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{r.data ? Object.entries(r.data).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}</span> },
            ]}
          />
        )}
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </Card>
    </>
  );
}
