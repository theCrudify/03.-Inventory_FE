'use client';
import { Check, Pencil, Printer, Send, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardHeader, DL, ErrorBox, FormSkeleton, PageHeader, Table, Tabs, cx, toast } from '@/components/ui';
import { api } from '@/lib/api';
import { canWrite, useAuth } from '@/lib/auth';
import { aju, date, dateTime, idr, money, num, qty } from '@/lib/format';
import { useMeta, type Meta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { CustomsDoc, CustomsLine } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';

/** Steps = initial status + the CEISA stage master (in time order), without the rejection branch. */
const stepsOf = (meta: Meta) => [
  { status: meta.statuses().find((s) => s.initial)?.code ?? '', afterSec: -1 },
  ...meta.refs('tahap_ceisa').map((r) => r.meta as { status: string; afterSec: number }).filter((s) => !meta.status(s.status).rejected),
].sort((a, b) => a.afterSec - b.afterSec);

function Stepper({ doc, meta }: { doc: CustomsDoc; meta: Meta }) {
  const steps = stepsOf(meta);
  const rejected = meta.status(doc.status).rejected;
  const reached = rejected ? doc.events.length - 1 : steps.findIndex((s) => s.status === doc.status);
  const live = meta.status(doc.status).inFlight;
  return (
    <div className="overflow-x-auto px-5 py-5">
      <ol className="flex items-start min-w-[580px]">
        {steps.map((s, i) => {
          const done = i <= reached;
          const fail = rejected && i === reached + 1;
          const ev = doc.events.find((e) => e.status === s.status);
          const label = fail ? meta.status(doc.status).label : meta.status(s.status).approved ? doc.type.approvalCode : meta.status(s.status).label;
          return (
            <li key={s.status} className="flex flex-1 items-start last:flex-none">
              <div className="flex w-24 flex-col items-center text-center">
                <span className={cx(
                  'grid size-8.5 place-items-center rounded-full border-2 text-xs font-bold transition-all shadow-2xs',
                  fail ? 'border-red-500 bg-red-500 text-white' : done ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500' : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500',
                  !rejected && i === reached && live && 'animate-pulse ring-4 ring-teal-500/20',
                )}>
                  {fail ? <X className="size-4" /> : done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cx('mt-2 text-xs font-semibold leading-tight', fail ? 'text-red-600 dark:text-red-400' : done ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500')}>{label}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{ev ? new Date(ev.createdAt).toLocaleTimeString('id-ID') : ''}</span>
              </div>
              {i < steps.length - 1 && <div className={cx('mt-4 h-0.5 flex-1 rounded-full', i < reached ? 'bg-teal-600 dark:bg-teal-500' : 'bg-slate-200 dark:bg-slate-800')} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function DocDetailPage() {
  const { jenis, id } = useParams<{ jenis: string; id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const meta = useMeta();
  const { t, td } = usePrefs();
  const { data: doc, error, reload } = useFetch<CustomsDoc>(`/customs-docs/${id}`);
  const [tab, setTab] = useState<'umum' | 'barang' | 'pungutan' | 'ceisa'>('umum');
  const [busy, setBusy] = useState(false);
  const live = !!doc && meta.status(doc.status).inFlight;

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => reload(true), 2500);
    return () => clearInterval(timer);
  }, [live, reload]);

  if (error) return <ErrorBox text={error} />;
  if (!doc) return <FormSkeleton />;
  const h = doc.header, L = meta.label, st = meta.status(doc.status), dir = meta.direction(doc.type.direction);
  const editable = canWrite(user) && st.editable;
  const rejection = doc.events.find((e) => meta.status(e.status).rejected);

  async function submit() {
    if (!confirm(t('doc.confirmSend', { label: doc!.type.label }))) return;
    setBusy(true);
    try { await api(`/customs-docs/${id}/submit`, { method: 'POST' }); toast(t('doc.sentToast')); setTab('ceisa'); await reload(true); }
    catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm(t('doc.confirmDeleteDraft'))) return;
    try { await api(`/customs-docs/${id}`, { method: 'DELETE' }); toast(t('doc.draftDeleted')); router.push(`/dokumen/${jenis}`); }
    catch (e) { toast((e as Error).message, 'err'); }
  }

  const lineCols = [
    { key: 'itemCode', label: t('items.code'), render: (l: CustomsLine) => <span className="font-mono text-xs">{l.itemCode}</span> },
    { key: 'itemName', label: t('items.name') },
    { key: 'hsCode', label: 'HS', render: (l: CustomsLine) => <span className="font-mono text-xs">{l.hsCode ?? '-'}</span> },
    { key: 'qty', label: t('form.colQty'), align: 'right' as const, render: (l: CustomsLine) => `${qty(l.qty)} ${l.uom}` },
    { key: 'unitPrice', label: t('form.colPrice'), align: 'right' as const, render: (l: CustomsLine) => num(l.unitPrice, 4) },
    { key: 'tarif', label: 'BM / PPN / PPh', align: 'right' as const, render: (l: CustomsLine) => `${num(l.bmRate, 1)} / ${num(l.ppnRate, 1)} / ${num(l.pphRate, 1)}%` },
    { key: 'sub', label: `${t('doc.value')} (${doc.currency})`, align: 'right' as const, render: (l: CustomsLine) => num(Number(l.qty) * Number(l.unitPrice), 2) },
  ];

  return (
    <>
      <PageHeader back={`/dokumen/${jenis}`} title={`${doc.type.label} · ${aju(doc.ajuNumber)}`}
        desc={<span className="flex flex-wrap items-center gap-2">{td(doc.type.title)}<Badge tone={st.tone} pulse={live}>{st.label}</Badge></span>}
        actions={<>
          <Button variant="secondary" href={`/cetak/${doc.id}`}><Printer className="size-4" />{t('common.print')}</Button>
          {editable && <>
            <Button variant="ghost" onClick={remove} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><Trash2 className="size-4" />{t('common.delete')}</Button>
            <Button variant="secondary" href={`/dokumen/${jenis}/${doc.id}/ubah`}><Pencil className="size-4" />{t('common.edit')}</Button>
            <Button onClick={submit} loading={busy}><Send className="size-4" />{rejection ? t('doc.resendCeisa') : t('doc.sendCeisa')}</Button>
          </>}
        </>} />

      {rejection && <div className="mb-4"><ErrorBox text={`${td(rejection.message)}. ${t('doc.rejectedHint')}`} /></div>}

      <Card className="mb-5 overflow-hidden">
        <Stepper doc={doc} meta={meta} />
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100/90 bg-slate-50/40 p-4 text-sm dark:border-slate-800/80 dark:bg-slate-900/40 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-3 border border-slate-200/60 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('doc.regNumberFull')}</div>
            <div className="mt-1 font-mono font-semibold text-slate-800 dark:text-slate-200">{doc.registrationNumber ?? '-'}</div>
          </div>
          <div className="rounded-lg bg-white p-3 border border-slate-200/60 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('doc.regDate')}</div>
            <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{date(doc.registrationDate)}</div>
          </div>
          <div className="rounded-lg bg-white p-3 border border-slate-200/60 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('doc.customsValue')}</div>
            <div className="mt-1 font-bold text-teal-700 dark:text-teal-400 tabular-nums">{idr(Number(doc.totalValue) * Number(doc.kurs))}</div>
          </div>
          <div className="rounded-lg bg-white p-3 border border-slate-200/60 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('doc.customsOffice')}</div>
            <div className="mt-1 font-medium text-slate-800 dark:text-slate-200"><span className="font-mono font-semibold text-teal-700 dark:text-teal-400">{doc.officeCode}</span> <span className="text-xs text-slate-500 dark:text-slate-400">· {L('kantor', doc.officeCode)}</span></div>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'umum', label: t('doc.tabGeneral') }, { key: 'barang', label: `${t('doc.tabItems')} (${doc.lines.length})` },
        { key: 'pungutan', label: t('doc.tabDuties') }, { key: 'ceisa', label: <span className="flex items-center gap-1.5">{t('doc.tabCeisa')} {live && <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />}</span> },
      ]} />
      <div className="mt-4">
        {tab === 'umum' && (
          <div className="space-y-4">
            <Card><CardHeader index={1} title={meta.direction(doc.type.direction).partyLabel} /><div className="p-5"><DL items={[
              [t('partners.name'), doc.partner.name], [t('partners.kind'), L('jenis_mitra', doc.partner.kind)], ['NPWP', doc.partner.npwp],
              [t('partners.country'), L('negara', doc.partner.countryCode)], [t('partners.address'), doc.partner.address],
            ]} /></div></Card>
            <Card><CardHeader index={2} title={t('doc.transportPack')} /><div className="p-5"><DL items={[
              [t('form.transportMode'), h.caraAngkut && L('cara_angkut', h.caraAngkut)], [t('form.carrierName'), h.pengangkut], ['Voyage / No. Polisi', h.nomorVoyage ?? h.nomorPolisi],
              [t('form.loadPort'), h.pelabuhanMuat && L('pelabuhan', h.pelabuhanMuat)], [t('form.destPort'), h.pelabuhanTujuan && L('pelabuhan', h.pelabuhanTujuan)],
              [dir.countryLabel, L('negara', String((h as Record<string, unknown>)[dir.countryField] ?? '') || null)],
              [t('form.incoterm'), h.incoterm && L('incoterm', h.incoterm)], [t('form.packCount'), h.kemasan?.jumlah ? `${h.kemasan.jumlah} ${L('kemasan', h.kemasan.jenis)}` : null],
              ['Bruto / Netto', h.bruto ? `${num(h.bruto, 2)} / ${num(h.netto, 2)} kg` : null],
              [`${t('form.currency')} / ${t('form.kurs')}`, `${L('valuta', doc.currency)} / ${num(doc.kurs, 2)}`], [t('form.destDelivery'), h.tujuanPengiriman],
              [t('form.containers'), h.kontainer?.length ? h.kontainer.map((k) => `${k.nomor} (${L('ukuran_kontainer', k.ukuran)} ${k.tipe})`).join(', ') : null],
            ]} /></div></Card>
            {h.jaminan && <Card><CardHeader index={3} title={t('doc.guarantee')} /><div className="p-5"><DL items={[
              [t('form.guaranteeType'), L('jenis_jaminan', h.jaminan.jenis)], [t('form.guaranteeNo'), h.jaminan.nomor], [t('form.guarantor'), h.jaminan.penjamin], [t('doc.value'), idr(h.jaminan.nilai)], [t('form.dueDate'), date(h.jaminan.jatuhTempo)],
            ]} /></div></Card>}
            <Card><CardHeader index={h.jaminan ? 4 : 3} title={t('doc.supportingDocs')} />
              <Table rows={(h.dokumen ?? []).map((d, i) => ({ ...d, id: i }))} columns={[
                { key: 'jenis', label: t('partners.kind'), render: (d) => L('jenis_dokumen', d.jenis) },
                { key: 'nomor', label: t('trade.number'), render: (d) => <span className="font-mono text-xs">{d.nomor}</span> },
                { key: 'tanggal', label: t('trade.date'), render: (d) => date(d.tanggal) },
              ]} />
            </Card>
          </div>
        )}
        {tab === 'barang' && <Card><Table rows={doc.lines} columns={lineCols} /><div className="flex justify-end border-t border-slate-100 px-5 py-3 text-sm font-semibold dark:border-slate-800">{t('common.total')} {money(doc.totalValue, doc.currency)}</div></Card>}
        {tab === 'pungutan' && (
          <Card>
            <CardHeader title={t('doc.dutyCalcTitle')} desc={t('doc.dutyCalcDesc', { treatment: doc.duties?.treatment ?? '-', kurs: num(doc.kurs, 2) })} />
            <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {[[t('doc.customsValue'), Number(doc.totalValue) * Number(doc.kurs)], [t('form.bm'), doc.duties?.bm], [t('form.ppn'), doc.duties?.ppn], [t('form.pph'), doc.duties?.pph]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between px-5 py-2.5"><dt className="text-slate-600 dark:text-slate-400">{k}</dt><dd className="tabular-nums">{idr(v as number)}</dd></div>
              ))}
              <div className="flex justify-between bg-slate-50 px-5 py-3 font-semibold dark:bg-slate-800/60"><dt>{t('common.total')} ({doc.duties?.treatment})</dt><dd className="tabular-nums">{idr(doc.duties?.total)}</dd></div>
            </dl>
          </Card>
        )}
        {tab === 'ceisa' && (
          <Card>
            <CardHeader title={t('doc.ceisaHistory')} desc={t('doc.ceisaHistoryDesc')} />
            {!doc.events.length ? <p className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">{t('doc.notSentCeisa')}</p> : (
              <ol className="relative space-y-5 px-5 py-5">
                {doc.events.map((e) => (
                  <li key={e.id} className="grid grid-cols-[auto_1fr] items-start gap-3">
                    <Badge tone={meta.status(e.status).tone}>{e.code}</Badge>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{td(e.message)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{dateTime(e.createdAt)}</div>
                      {e.payload && <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100 dark:bg-slate-950">{JSON.stringify(e.payload, null, 2)}</pre>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
