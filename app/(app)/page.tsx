'use client';
import { ArrowUpRight, Boxes, CheckCircle2, FileClock, FilePen, FileX2, Plus, Users } from 'lucide-react';
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

const BAR: Record<Tone, string> = { teal: 'bg-teal-500', amber: 'bg-amber-400', blue: 'bg-blue-500', violet: 'bg-violet-500', green: 'bg-emerald-500', red: 'bg-red-500', gray: 'bg-slate-400' };

/** Round an axis maximum up to 1/2/2.5/5 × 10ⁿ so gridlines land on readable values. */
const niceMax = (v: number) => {
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const meta = useMeta();
  const { t, lang } = usePrefs();
  const { data, error, reload } = useFetch<Dashboard>('/dashboard');
  const statuses = meta.statuses();
  const sumWhere = (pred: (s: ReturnType<typeof meta.status>) => boolean) => statuses.filter(pred).reduce((a, s) => a + (data?.byStatus[s.code] ?? 0), 0);
  const inFlight = sumWhere((s) => s.inFlight);
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const monthFmt = (m: string) => new Date(`${m}-01`).toLocaleDateString(locale, { month: 'short' });
  const compact = (v: number) => (v ? 'Rp ' + new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v) : '0');

  useEffect(() => {
    if (!inFlight) return;
    const timer = setInterval(() => reload(true), 4000);
    return () => clearInterval(timer);
  }, [inFlight, reload]);

  if (error) return <ErrorBox text={error} />;
  if (!data) return <DashboardSkeleton />;
  const { totals, trend, perJenis, recentEvents } = data;
  const directions = meta.refs('arah_dokumen').map((d) => meta.direction(d.code));
  const max = niceMax(Math.max(1, ...trend.flatMap((tr) => Object.values(tr.values))));
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const labelOf = (pred: (s: ReturnType<typeof meta.status>) => boolean) => statuses.find(pred)?.label ?? '';
  const maxDocs = Math.max(1, ...perJenis.map((x) => x.total));

  return (
    <>
      <PageHeader
        title={`${t('dash.welcome')}, ${user?.name.split(' ')[0]}`}
        desc={t('dash.desc')}
        actions={canWrite(user) && meta.bcTypes.filter((b) => b.international).map((b, i) => (
          <Button key={b.code} variant={i ? 'primary' : 'secondary'} href={`/dokumen/${b.slug}/baru`}><Plus />{b.label}</Button>
        ))}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone="green" label={labelOf((s) => s.approved)} value={num(sumWhere((s) => s.approved))} icon={<CheckCircle2 />} sub={t('dash.fromDocs', { n: num(totals.dokumen) })} />
        <Stat tone="amber" label={t('dash.inCeisa')} value={num(inFlight)} icon={<FileClock />} sub={inFlight ? <Badge tone="amber" pulse>{t('dash.waitingResponse')}</Badge> : t('dash.noQueue')} />
        <Stat tone="gray" label={labelOf((s) => s.initial)} value={num(sumWhere((s) => s.initial))} icon={<FilePen />} sub={t('dash.notSent')} />
        <Stat tone="red" label={labelOf((s) => s.rejected)} value={num(sumWhere((s) => s.rejected))} icon={<FileX2 />} sub={t('dash.needsFix')} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('dash.trendTitle')}
            desc={t('dash.trendDesc', { n: trend.length })}
            action={
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                {directions.map((d) => (
                  <span key={d.code} className="inline-flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${BAR[d.tone]}`} />{d.label}
                  </span>
                ))}
              </div>
            }
          />
          <div className="flex gap-3 px-5 pb-4 pt-5">
            {/* Y axis */}
            <div className="relative h-56 w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
              {ticks.map((f) => (
                <span key={f} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - f) * 100}%` }}>{compact(max * f)}</span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="relative h-56">
                {ticks.map((f) => (
                  <div key={f} className={`absolute inset-x-0 border-t ${f === 0 ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-100 dark:border-slate-800'}`} style={{ top: `${(1 - f) * 100}%` }} />
                ))}
                <div className="absolute inset-0 flex items-end">
                  {trend.map((tr) => (
                    <div key={tr.month} className="group relative flex h-full flex-1 items-end justify-center gap-1 rounded-md px-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {directions.map((d) => {
                        const val = tr.values[d.code] ?? 0;
                        return (
                          <div
                            key={d.code}
                            style={{ height: `${Math.max(val ? 1.5 : 0, (val / max) * 100)}%` }}
                            className={`w-full max-w-6 rounded-t-[4px] transition-[height] duration-500 ${BAR[d.tone]}`}
                          />
                        );
                      })}
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-white shadow-pop group-hover:block dark:bg-slate-700">
                        <p className="mb-1 font-medium">{new Date(`${tr.month}-01`).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
                        {directions.map((d) => (
                          <p key={d.code} className="flex items-center gap-1.5 tabular-nums text-slate-300">
                            <span className={`size-1.5 rounded-full ${BAR[d.tone]}`} />{d.label}: <span className="font-medium text-white">{idr(tr.values[d.code] ?? 0)}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex">
                {trend.map((tr) => <span key={tr.month} className="flex-1 text-center text-[11px] text-slate-500">{monthFmt(tr.month)}</span>)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('dash.perType')} desc={t('dash.fromDocs', { n: num(totals.dokumen) })} />
          <ul className="p-2">
            {perJenis.map((p) => {
              const bc = meta.bc(p.bcType);
              const dir = bc && meta.direction(bc.direction);
              return (
                <li key={p.bcType}>
                  <Link href={`/dokumen/${bc?.slug}`} className="group block rounded-lg px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{bc?.label}</span>
                        <span className="text-xs text-slate-400">{dir?.shortLabel}</span>
                      </span>
                      <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{p.total}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${dir ? BAR[dir.tone] : 'bg-slate-400'}`} style={{ width: `${(p.total / maxDocs) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('dash.recentCeisa')} desc={t('dash.recentCeisaDesc')} />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {recentEvents.length === 0 ? (
              <li className="px-5 py-12 text-center text-[13px] text-slate-400">{t('dash.noQueue')}</li>
            ) : recentEvents.map((e) => (
              <li key={e.id}>
                <Link href={`/dokumen/${meta.bc(e.bcType)?.slug}/${e.docId}`} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <span className="w-14 shrink-0"><Badge tone={meta.status(e.status).tone} dot>{e.code}</Badge></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">{e.message}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      <span className="font-medium text-slate-600 dark:text-slate-400">{meta.bc(e.bcType)?.label}</span>
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">/</span>
                      <span className="font-mono tabular-nums">{aju(e.ajuNumber)}</span>
                    </span>
                  </span>
                  <span className="hidden whitespace-nowrap text-xs tabular-nums text-slate-400 sm:block">{dateTime(e.createdAt)}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-600 dark:text-slate-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid content-start gap-4">
          <Stat tone="teal" href="/master/barang" label={t('dash.registeredItems')} value={num(totals.barang)} icon={<Boxes />} sub={<span className="font-medium text-teal-700 dark:text-teal-400">{t('dash.viewStock')}</span>} />
          <Stat tone="blue" href="/master/mitra" label={t('dash.partners')} value={num(totals.mitra)} icon={<Users />} sub={meta.refs('jenis_mitra').map((r) => r.name.toLowerCase()).join(', ')} />
        </div>
      </div>
    </>
  );
}
