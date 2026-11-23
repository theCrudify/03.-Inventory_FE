'use client';
import { Boxes, CheckCircle2, FileClock, FilePen, FileX2, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Badge, Button, Card, CardHeader, DashboardSkeleton, ErrorBox, PageHeader, Stat } from '@/components/ui';
import { canWrite, useAuth } from '@/lib/auth';
import { aju, dateTime, idr, num } from '@/lib/format';
import { useMeta, type Tone } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import { useFetch } from '@/lib/use-fetch';

type Dashboard = {
  byStatus: Record<string, number>;
  totals: { dokumen: number; barang: number; mitra: number };
  perJenis: { bcType: string; total: number }[];
  trend: { month: string; values: Record<string, number> }[];
  recentEvents: { id: number; docId: number; status: string; code: string; message: string; createdAt: string; ajuNumber: string; bcType: string }[];
};

const BAR: Record<Tone, string> = { teal: 'bg-teal-600 dark:bg-teal-500', amber: 'bg-amber-500', blue: 'bg-blue-500', violet: 'bg-violet-500', green: 'bg-emerald-600 dark:bg-emerald-500', red: 'bg-red-500', gray: 'bg-slate-400' };

export default function DashboardPage() {
  const { user } = useAuth();
  const meta = useMeta();
  const { t, lang } = usePrefs();
  const { data, error, reload } = useFetch<Dashboard>('/dashboard');
  const statuses = meta.statuses();
  const sumWhere = (pred: (s: ReturnType<typeof meta.status>) => boolean) => statuses.filter(pred).reduce((a, s) => a + (data?.byStatus[s.code] ?? 0), 0);
  const inFlight = sumWhere((s) => s.inFlight);
  const monthFmt = (m: string) => new Date(`${m}-01`).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'short', year: '2-digit' });

  useEffect(() => {
    if (!inFlight) return;
    const timer = setInterval(() => reload(true), 4000);
    return () => clearInterval(timer);
  }, [inFlight, reload]);

  if (error) return <ErrorBox text={error} />;
  if (!data) return <DashboardSkeleton />;
  const { totals, trend, perJenis, recentEvents } = data;
  const directions = meta.refs('arah_dokumen').map((d) => meta.direction(d.code));
  const max = Math.max(1, ...trend.flatMap((tr) => Object.values(tr.values)));
  const labelOf = (pred: (s: ReturnType<typeof meta.status>) => boolean) => statuses.find(pred)?.label ?? '';

  return (
    <>
      <PageHeader
        title={`${t('dash.welcome')}, ${user?.name.split(' ')[0]}`}
        desc={t('dash.desc')}
        actions={canWrite(user) && meta.bcTypes.filter((b) => b.international).map((b, i) => (
          <Button key={b.code} variant={i ? 'primary' : 'secondary'} href={`/dokumen/${b.slug}/baru`}><Plus className="size-4" />{b.label}</Button>
        ))}
      />
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat label={labelOf((s) => s.approved)} value={num(sumWhere((s) => s.approved))} icon={<CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />} sub={t('dash.fromDocs', { n: num(totals.dokumen) })} />
        <Stat label={t('dash.inCeisa')} value={num(inFlight)} icon={<FileClock className="size-4 text-amber-600 dark:text-amber-400" />} sub={inFlight ? <Badge tone="amber" pulse>{t('dash.waitingResponse')}</Badge> : t('dash.noQueue')} />
        <Stat label={labelOf((s) => s.initial)} value={num(sumWhere((s) => s.initial))} icon={<FilePen className="size-4 text-slate-500 dark:text-slate-400" />} sub={t('dash.notSent')} />
        <Stat label={labelOf((s) => s.rejected)} value={num(sumWhere((s) => s.rejected))} icon={<FileX2 className="size-4 text-red-600 dark:text-red-400" />} sub={t('dash.needsFix')} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            title={t('dash.trendTitle')}
            desc={t('dash.trendDesc', { n: trend.length })}
            action={
              <div className="flex flex-wrap gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                {directions.map((d) => (
                  <span key={d.code} className="inline-flex items-center gap-1.5 font-medium">
                    <span className={`size-2.5 rounded-sm ${BAR[d.tone]}`} />
                    {d.label}
                  </span>
                ))}
              </div>
            }
          />
          <div className="flex h-60 items-end gap-3 px-5 pb-5 pt-8">
            {trend.map((tr) => (
              <div key={tr.month} className="flex h-full flex-1 flex-col items-center gap-2.5">
                <div className="flex w-full flex-1 items-end justify-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                  {directions.map((d) => {
                    const val = tr.values[d.code] ?? 0;
                    const heightPct = Math.max(3, (val / max) * 100);
                    return (
                      <div
                        key={d.code}
                        title={`${d.label}: ${idr(val)}`}
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-7 rounded-t-sm transition-all duration-300 hover:opacity-85 ${BAR[d.tone]}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{monthFmt(tr.month)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title={t('dash.perType')} />
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800/80">
            {perJenis.map((p) => {
              const bc = meta.bc(p.bcType);
              const maxDocs = Math.max(1, ...perJenis.map((x) => x.total));
              const pct = Math.round((p.total / maxDocs) * 100);
              return (
                <li key={p.bcType} className="relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-teal-50/50 dark:bg-teal-950/20 transition-all pointer-events-none"
                    style={{ width: `${pct}%` }}
                  />
                  <Link
                    href={`/dokumen/${bc?.slug}`}
                    className="relative flex items-center justify-between px-5 py-2.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{bc?.label}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{bc && meta.direction(bc.direction).shortLabel}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{p.total}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title={t('dash.recentCeisa')} desc={t('dash.recentCeisaDesc')} />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentEvents.length === 0 ? (
              <li className="px-5 py-10 text-center text-xs text-slate-400 dark:text-slate-500">{t('dash.noQueue')}</li>
            ) : recentEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/dokumen/${meta.bc(e.bcType)?.slug}/${e.docId}`}
                  className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  <Badge tone={meta.status(e.status).tone}>{e.code}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">{e.message}</span>
                    <span className="mt-0.5 block font-mono text-xs text-slate-500 dark:text-slate-400">{meta.bc(e.bcType)?.label} · {aju(e.ajuNumber)}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">{dateTime(e.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid content-start gap-3.5">
          <Stat label={t('dash.registeredItems')} value={num(totals.barang)} icon={<Boxes className="size-4 text-slate-500 dark:text-slate-400" />} sub={<Link className="font-semibold text-teal-700 hover:underline dark:text-teal-400" href="/master/barang">{t('dash.viewStock')}</Link>} />
          <Stat label={t('dash.partners')} value={num(totals.mitra)} icon={<Users className="size-4 text-slate-500 dark:text-slate-400" />} sub={meta.refs('jenis_mitra').map((r) => r.name.toLowerCase()).join(', ')} />
        </div>
      </div>
    </>
  );
}
