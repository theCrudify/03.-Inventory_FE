'use client';
import { Check, Pencil, Printer, Send, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardHeader, DL, ErrorBox, PageHeader, Spinner, Table, Tabs, cx, toast } from '@/components/ui';
import { api } from '@/lib/api';
import { canWrite, useAuth } from '@/lib/auth';
import { aju, date, dateTime, idr, money, num, qty } from '@/lib/format';
import { useMeta, type Meta } from '@/lib/meta';
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
  // Rejected: the last event is the rejection itself, so the last passed step is one before it.
  const reached = rejected ? doc.events.length - 1 : steps.findIndex((s) => s.status === doc.status);
  const live = meta.status(doc.status).inFlight;
  return (
    <ol className="flex items-start overflow-x-auto px-5 py-5">
      {steps.map((s, i) => {
        const done = i <= reached;
        const fail = rejected && i === reached + 1;
        const ev = doc.events.find((e) => e.status === s.status);
        const label = fail ? meta.status(doc.status).label : meta.status(s.status).approved ? doc.type.approvalCode : meta.status(s.status).label;
        return (
          <li key={s.status} className="flex flex-1 items-start last:flex-none">
            <div className="flex w-24 flex-col items-center text-center">
              <span className={cx('grid size-8 place-items-center rounded-full border-2 text-xs font-semibold',
                fail ? 'border-red-500 bg-red-500 text-white' : done ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-400',
                !rejected && i === reached && live && 'animate-pulse')}>
                {fail ? <X className="size-4" /> : done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cx('mt-1.5 text-xs font-medium', fail ? 'text-red-600' : done ? 'text-slate-800' : 'text-slate-400')}>{label}</span>
              <span className="text-[10px] text-slate-400">{ev ? new Date(ev.createdAt).toLocaleTimeString('id-ID') : ''}</span>
            </div>
            {i < steps.length - 1 && <div className={cx('mt-4 h-0.5 flex-1', i < reached ? 'bg-teal-600' : 'bg-slate-200')} />}
          </li>
        );
      })}
    </ol>
  );
}

export default function DocDetailPage() {
  const { jenis, id } = useParams<{ jenis: string; id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const meta = useMeta();
  const { data: doc, error, reload } = useFetch<CustomsDoc>(`/customs-docs/${id}`);
  const [tab, setTab] = useState<'umum' | 'barang' | 'pungutan' | 'ceisa'>('umum');
  const [busy, setBusy] = useState(false);
  const live = !!doc && meta.status(doc.status).inFlight;

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => reload(true), 2500);
    return () => clearInterval(t);
  }, [live, reload]);

  if (error) return <ErrorBox text={error} />;
  if (!doc) return <Spinner />;
  const h = doc.header, L = meta.label, st = meta.status(doc.status), dir = meta.direction(doc.type.direction);
  const editable = canWrite(user) && st.editable;
  const rejection = doc.events.find((e) => meta.status(e.status).rejected);

  async function submit() {
    if (!confirm(`Kirim ${doc!.type.label} ke CEISA? Setelah dikirim dokumen tidak dapat diubah.`)) return;
    setBusy(true);
    try { await api(`/customs-docs/${id}/submit`, { method: 'POST' }); toast('Dokumen dikirim ke CEISA'); setTab('ceisa'); await reload(true); }
    catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm('Hapus draft dokumen ini?')) return;
    try { await api(`/customs-docs/${id}`, { method: 'DELETE' }); toast('Draft dihapus'); router.push(`/dokumen/${jenis}`); }
    catch (e) { toast((e as Error).message, 'err'); }
  }

  const lineCols = [
    { key: 'no', label: 'No', render: (l: CustomsLine) => doc.lines.indexOf(l) + 1 },
    { key: 'itemCode', label: 'Kode', render: (l: CustomsLine) => <span className="font-mono text-xs">{l.itemCode}</span> },
    { key: 'itemName', label: 'Uraian Barang' },
    { key: 'hsCode', label: 'HS', render: (l: CustomsLine) => <span className="font-mono text-xs">{l.hsCode ?? '-'}</span> },
    { key: 'qty', label: 'Jumlah', align: 'right' as const, render: (l: CustomsLine) => `${qty(l.qty)} ${l.uom}` },
    { key: 'unitPrice', label: 'Harga', align: 'right' as const, render: (l: CustomsLine) => num(l.unitPrice, 4) },
    { key: 'tarif', label: 'BM / PPN / PPh', align: 'right' as const, render: (l: CustomsLine) => `${num(l.bmRate, 1)} / ${num(l.ppnRate, 1)} / ${num(l.pphRate, 1)}%` },
    { key: 'sub', label: `Nilai (${doc.currency})`, align: 'right' as const, render: (l: CustomsLine) => num(Number(l.qty) * Number(l.unitPrice), 2) },
  ];

  return (
    <>
      <PageHeader back={`/dokumen/${jenis}`} title={`${doc.type.label} · ${aju(doc.ajuNumber)}`}
        desc={<span className="flex flex-wrap items-center gap-2">{doc.type.title}<Badge tone={st.tone} pulse={live}>{st.label}</Badge></span>}
        actions={<>
          <Button variant="secondary" href={`/cetak/${doc.id}`}><Printer className="size-4" />Cetak</Button>
          {editable && <>
            <Button variant="ghost" onClick={remove} className="text-red-600 hover:bg-red-50"><Trash2 className="size-4" />Hapus</Button>
            <Button variant="secondary" href={`/dokumen/${jenis}/${doc.id}/ubah`}><Pencil className="size-4" />Ubah</Button>
            <Button onClick={submit} loading={busy}><Send className="size-4" />{rejection ? 'Kirim Ulang' : 'Kirim ke CEISA'}</Button>
          </>}
        </>} />

      {rejection && <div className="mb-4"><ErrorBox text={`${rejection.message}. Perbaiki dokumen lalu kirim ulang.`} /></div>}

      <Card className="mb-4">
        <Stepper doc={doc} meta={meta} />
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-5 py-4 text-sm sm:grid-cols-4">
          <div><div className="text-xs text-slate-500">Nomor Pendaftaran</div><div className="font-mono font-medium">{doc.registrationNumber ?? '-'}</div></div>
          <div><div className="text-xs text-slate-500">Tanggal Daftar</div><div className="font-medium">{date(doc.registrationDate)}</div></div>
          <div><div className="text-xs text-slate-500">Nilai Pabean</div><div className="font-medium tabular-nums">{idr(Number(doc.totalValue) * Number(doc.kurs))}</div></div>
          <div><div className="text-xs text-slate-500">Kantor Pabean</div><div className="font-medium"><span className="font-mono">{doc.officeCode}</span> <span className="text-xs text-slate-500">{L('kantor', doc.officeCode)}</span></div></div>
        </div>
      </Card>

      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'umum', label: 'Data Umum' }, { key: 'barang', label: `Barang (${doc.lines.length})` },
        { key: 'pungutan', label: 'Pungutan' }, { key: 'ceisa', label: <span className="flex items-center gap-1.5">Respon CEISA {live && <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />}</span> },
      ]} />
      <div className="mt-4">
        {tab === 'umum' && (
          <div className="space-y-4">
            <Card><CardHeader title={meta.direction(doc.type.direction).partyLabel} /><div className="p-5"><DL items={[
              ['Nama', doc.partner.name], ['Jenis', L('jenis_mitra', doc.partner.kind)], ['NPWP', doc.partner.npwp],
              ['Negara', L('negara', doc.partner.countryCode)], ['Alamat', doc.partner.address],
            ]} /></div></Card>
            <Card><CardHeader title="Pengangkutan & Kemasan" /><div className="p-5"><DL items={[
              ['Cara Angkut', h.caraAngkut && L('cara_angkut', h.caraAngkut)], ['Sarana Pengangkut', h.pengangkut], ['Voyage / No. Polisi', h.nomorVoyage ?? h.nomorPolisi],
              ['Pelabuhan Muat', h.pelabuhanMuat && L('pelabuhan', h.pelabuhanMuat)], ['Pelabuhan Tujuan', h.pelabuhanTujuan && L('pelabuhan', h.pelabuhanTujuan)],
              [dir.countryLabel, L('negara', String((h as Record<string, unknown>)[dir.countryField] ?? '') || null)],
              ['Incoterm', h.incoterm && L('incoterm', h.incoterm)], ['Kemasan', h.kemasan?.jumlah ? `${h.kemasan.jumlah} ${L('kemasan', h.kemasan.jenis)}` : null],
              ['Bruto / Netto', h.bruto ? `${num(h.bruto, 2)} / ${num(h.netto, 2)} kg` : null],
              ['Valuta / Kurs', `${L('valuta', doc.currency)} / ${num(doc.kurs, 2)}`], ['Tujuan Pengiriman', h.tujuanPengiriman],
              ['Kontainer', h.kontainer?.length ? h.kontainer.map((k) => `${k.nomor} (${L('ukuran_kontainer', k.ukuran)} ${k.tipe})`).join(', ') : null],
            ]} /></div></Card>
            {h.jaminan && <Card><CardHeader title="Jaminan" /><div className="p-5"><DL items={[
              ['Jenis', L('jenis_jaminan', h.jaminan.jenis)], ['Nomor', h.jaminan.nomor], ['Penjamin', h.jaminan.penjamin], ['Nilai', idr(h.jaminan.nilai)], ['Jatuh Tempo', date(h.jaminan.jatuhTempo)],
            ]} /></div></Card>}
            <Card><CardHeader title="Dokumen Pelengkap" />
              <Table rows={(h.dokumen ?? []).map((d, i) => ({ ...d, id: i }))} columns={[
                { key: 'jenis', label: 'Jenis', render: (d) => L('jenis_dokumen', d.jenis) },
                { key: 'nomor', label: 'Nomor', render: (d) => <span className="font-mono text-xs">{d.nomor}</span> }, { key: 'tanggal', label: 'Tanggal', render: (d) => date(d.tanggal) },
              ]} />
            </Card>
          </div>
        )}
        {tab === 'barang' && <Card><Table rows={doc.lines} columns={lineCols} /><div className="flex justify-end border-t border-slate-100 px-5 py-3 text-sm font-semibold">Total {money(doc.totalValue, doc.currency)}</div></Card>}
        {tab === 'pungutan' && (
          <Card>
            <CardHeader title="Perhitungan Pungutan" desc={`Perlakuan: ${doc.duties?.treatment ?? '-'}. Dasar: nilai pabean × kurs ${num(doc.kurs, 2)}; tarif per pos dari master HS.`} />
            <dl className="divide-y divide-slate-100 text-sm">
              {[['Nilai Pabean', Number(doc.totalValue) * Number(doc.kurs)], ['Bea Masuk (BM)', doc.duties?.bm], ['PPN', doc.duties?.ppn], ['PPh Pasal 22', doc.duties?.pph]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between px-5 py-2.5"><dt className="text-slate-600">{k}</dt><dd className="tabular-nums">{idr(v as number)}</dd></div>
              ))}
              <div className="flex justify-between bg-slate-50 px-5 py-3 font-semibold"><dt>Total Pungutan ({doc.duties?.treatment})</dt><dd className="tabular-nums">{idr(doc.duties?.total)}</dd></div>
            </dl>
          </Card>
        )}
        {tab === 'ceisa' && (
          <Card>
            <CardHeader title="Riwayat Respon CEISA" desc="Host-to-host (mock). Halaman ter-update otomatis saat dokumen diproses." />
            {!doc.events.length ? <p className="px-5 py-10 text-center text-sm text-slate-400">Dokumen belum dikirim ke CEISA.</p> : (
              <ol className="relative space-y-5 px-5 py-5">
                {doc.events.map((e) => (
                  <li key={e.id} className="grid grid-cols-[auto_1fr] items-start gap-3">
                    <Badge tone={meta.status(e.status).tone}>{e.code}</Badge>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800">{e.message}</div>
                      <div className="text-xs text-slate-500">{dateTime(e.createdAt)}</div>
                      {e.payload && <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">{JSON.stringify(e.payload, null, 2)}</pre>}
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
