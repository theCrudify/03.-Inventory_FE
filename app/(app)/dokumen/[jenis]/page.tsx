'use client';
import { Plus, RotateCcw } from 'lucide-react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, ErrorBox, FilterBar, FilterDateRange, PageHeader, Pagination, SearchInput, Select, Table } from '@/components/ui';
import { qs, type Paged } from '@/lib/api';
import { canWrite, useAuth } from '@/lib/auth';
import { aju, date, money, today } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { CustomsListRow } from '@/lib/types';
import { useDebouncedValue, useFetch } from '@/lib/use-fetch';

export default function DocListPage() {
  const { jenis } = useParams<{ jenis: string }>();
  const meta = useMeta();
  const { t } = usePrefs();
  const cfg = meta.bcBySlug(jenis);
  if (!cfg) notFound();
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 280);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data, error, loading, reload } = useFetch<Paged<CustomsListRow>>(
    `/customs-docs${qs({ bc: cfg.code, page, pageSize, q: debouncedQ, status, from, to, sortBy, sortDir })}`,
  );
  const live = data?.data.some((d) => meta.status(d.status).inFlight);
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => reload(true), 4000);
    return () => clearInterval(timer);
  }, [live, reload]);

  const onSort = (key: string) => {
    setPage(1);
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const hasFilters = !!(q || status || from || to || sortBy !== 'createdAt' || sortDir !== 'desc');
  const reset = () => {
    setQ(''); setStatus(''); setFrom(''); setTo('');
    setPage(1); setSortBy('createdAt'); setSortDir('desc');
  };

  return (
    <>
      <PageHeader title={cfg.label} desc={cfg.title} />
      <Card>
        <FilterBar
          search={
            <SearchInput
              placeholder={t('doc.searchPlaceholder')}
              value={q}
              searching={loading && q !== debouncedQ}
              onChange={(v) => { setQ(v); setPage(1); }}
            />
          }
          filters={
            <>
              <div className="w-full sm:w-44">
                <Select
                  aria-label={t('doc.status')}
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  placeholder={t('doc.allStatuses')}
                  options={meta.statusOptions()}
                />
              </div>
              <FilterDateRange
                from={from}
                to={to}
                onFromChange={(val) => { setFrom(val); setPage(1); }}
                onToChange={(val) => { setTo(val); setPage(1); }}
                fromLabel={t('report.from')}
                toLabel={t('report.to')}
                maxDate={today()}
              />
            </>
          }
          actions={
            canWrite(user) && (
              <Button href={`/dokumen/${jenis}/baru`}>
                <Plus className="size-4" />
                {t('doc.create')} {cfg.label}
              </Button>
            )
          }
          hasActiveFilters={hasFilters}
          activeFilterCount={(status ? 1 : 0) + (from || to ? 1 : 0)}
          onReset={reset}
        />
        {error ? <div className="p-4"><ErrorBox text={error} /></div> : (
          <Table<CustomsListRow>
            loading={loading}
            rows={data?.data ?? []}
            emptyText={debouncedQ || status || from || to ? t('common.noSearchData') : t('common.noData')}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            rowNumberOffset={data ? (data.page - 1) * data.pageSize : 0}
            onRowClick={(r) => router.push(`/dokumen/${jenis}/${r.id}`)}
            columns={[
              { key: 'ajuNumber', sortable: true, label: t('doc.ajuNumber'), className: 'w-60 whitespace-nowrap', render: (r) => <span className="whitespace-nowrap font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{aju(r.ajuNumber)}</span> },
              { key: 'registrationNumber', sortable: true, label: t('doc.regNumber'), className: 'w-44', render: (r) => r.registrationNumber ? <span className="font-mono text-xs font-medium">{r.registrationNumber}<span className="block text-slate-400 dark:text-slate-500 font-normal">{date(r.registrationDate)}</span></span> : <span className="text-slate-400">-</span> },
              { key: 'partnerName', sortable: true, label: meta.direction(cfg.direction).partyLabel, className: 'min-w-[200px]' },
              { key: 'totalValue', sortable: true, label: t('doc.value'), className: 'w-44 whitespace-nowrap', align: 'right', render: (r) => <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(r.totalValue, r.currency)}</span> },
              { key: 'status', sortable: true, label: t('doc.status'), className: 'w-36 whitespace-nowrap text-center', render: (r) => { const st = meta.status(r.status); return <Badge tone={st.tone} pulse={st.inFlight}>{st.label}</Badge>; } },
              { key: 'createdAt', sortable: true, label: t('doc.createdAt'), className: 'w-36 whitespace-nowrap', render: (r) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{date(r.createdAt)}</span> },
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
          />
        )}
      </Card>
    </>
  );
}
