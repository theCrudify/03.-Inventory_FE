'use client';
import { Boxes, CheckCircle2, FileClock, FilePen, FileX2, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Badge, Button, Card, CardHeader, ErrorBox, PageHeader, Spinner, Stat } from '@/components/ui';
import { canWrite, useAuth } from '@/lib/auth';
import { aju, dateTime, idr, num } from '@/lib/format';
import { useMeta, type Tone } from '@/lib/meta';
import { useFetch } from '@/lib/use-fetch';

type Dashboard = {
  byStatus: Record<string, number>;
  totals: { dokumen: number; barang: number; mitra: number };
  perJenis: { bcType: string; total: number }[];
  trend: { month: string; values: Record<string, number> }[];
  recentEvents: { id: number; docId: number; status: string; code: string; message: string; createdAt: string; ajuNumber: string; bcType: string }[];
};

const month = (m: string) => new Date(`${m}-01`).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
const BAR: Record<Tone, string> = { teal: 'bg-teal-600', amber: 'bg-amber-500', blue: 'bg-blue-500', violet: 'bg-violet-500', green: 'bg-emerald-600', red: 'bg-red-500', gray: 'bg-slate-400' };

export default function DashboardPage() {
  const { user } = useAuth();
  const meta = useMeta();
  const { data, error, reload } = useFetch<Dashboard>('/dashboard');
  const statuses = meta.statuses();
  const sumWhere = (pred: (s: ReturnType<typeof meta.status>) => boolean) => statuses.filter(pred).reduce((a, s) => a + (data?.byStatus[s.code] ?? 0), 0);
  const inFlight = sumWhere((s) => s.inFlight);

  // Keep CEISA responses fresh while documents are in process.
  useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(() => reload(true), 4000);
    return () => clearInterval(t);
  }, [inFlight, reload]);

  if (error) return <ErrorBox text={error} />;
  if (!data) return <Spinner />;
  const { totals, trend, perJenis, recentEvents } = data;
  const directions = meta.refs('arah_dokumen').map((d) => meta.direction(d.code));
  const max = Math.max(1, ...trend.flatMap((t) => Object.values(t.values)));
  const labelOf = (pred: (s: ReturnType<typeof meta.status>) => boolean) => statuses.find(pred)?.label ?? '';

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user?.name.split(' ')[0]}`}
        desc="Ringkasan dokumen kepabeanan dan pergerakan barang."
        actions={canWrite(user) && meta.bcTypes.filter((b) => b.international).map((b, i) => (
          <Button key={b.code} variant={i ? 'primary' : 'secondary'} href={`/dokumen/${b.slug}/baru`}><Plus className="size-4" />{b.label}</Button>
        ))}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={labelOf((s) => s.approved)} value={num(sumWhere((s) => s.approved))} icon={<CheckCircle2 className="size-4 text-emerald-600" />} sub={`dari ${num(totals.dokumen)} dokumen`} />
        <Stat label="Proses di CEISA" value={num(inFlight)} icon={<FileClock className="size-4 text-amber-600" />} sub={inFlight ? <Badge tone="amber" pulse>menunggu respon</Badge> : 'tidak ada antrian'} />
        <Stat label={labelOf((s) => s.initial)} value={num(sumWhere((s) => s.initial))} icon={<FilePen className="size-4 text-slate-500" />} sub="belum dikirim" />
        <Stat label={labelOf((s) => s.rejected)} value={num(sumWhere((s) => s.rejected))} icon={<FileX2 className="size-4 text-red-600" />} sub="perlu perbaikan" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Nilai pabean dokumen disetujui" desc={`${trend.length} bulan terakhir, dalam Rupiah`} action={
            <div className="flex gap-3 text-xs text-slate-500">
              {directions.map((d) => <span key={d.code} className="flex items-center gap-1.5"><span className={`size-2.5 rounded-sm ${BAR[d.tone]}`} />{d.label}</span>)}
            </div>} />
          <div className="flex h-56 items-end gap-3 px-5 pb-4 pt-6">
            {trend.map((t) => (
              <div key={t.month} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  {directions.map((d) => (
                    <div key={d.code} title={`${d.label}: ${idr(t.values[d.code] ?? 0)}`} style={{ height: `${((t.values[d.code] ?? 0) / max) * 100}%` }}
                      className={`min-h-px w-full max-w-7 rounded-t ${BAR[d.tone]}`} />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">{month(t.month)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Dokumen per jenis" />
          <ul className="divide-y divide-slate-100 text-sm">
            {perJenis.map((p) => {
              const bc = meta.bc(p.bcType);
              return (
                <li key={p.bcType}>
                  <Link href={`/dokumen/${bc?.slug}`} className="flex items-center justify-between px-5 py-2 hover:bg-slate-50">
                    <span><span className="font-medium text-slate-800">{bc?.label}</span><span className="ml-2 text-xs text-slate-400">{bc && meta.direction(bc.direction).shortLabel}</span></span>
                    <span className="tabular-nums text-slate-600">{p.total}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Respon CEISA terbaru" desc="Riwayat status host-to-host" />
          <ul className="divide-y divide-slate-100">
            {recentEvents.map((e) => (
              <li key={e.id}>
                <Link href={`/dokumen/${meta.bc(e.bcType)?.slug}/${e.docId}`} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                  <Badge tone={meta.status(e.status).tone}>{e.code}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-800">{e.message}</span>
                    <span className="block font-mono text-xs text-slate-500">{meta.bc(e.bcType)?.label} · {aju(e.ajuNumber)}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-400">{dateTime(e.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid content-start gap-3">
          <Stat label="Barang terdaftar" value={num(totals.barang)} icon={<Boxes className="size-4 text-slate-500" />} sub={<Link className="text-teal-700 hover:underline" href="/master/barang">Lihat saldo barang →</Link>} />
          <Stat label="Mitra usaha" value={num(totals.mitra)} icon={<Users className="size-4 text-slate-500" />} sub={meta.refs('jenis_mitra').map((r) => r.name.toLowerCase()).join(', ')} />
        </div>
      </div>
    </>
  );
}
