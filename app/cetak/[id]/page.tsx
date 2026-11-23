'use client';
import { ArrowLeft, Printer } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button, ErrorBox, Spinner } from '@/components/ui';
import { aju, date, dateTime, idr, num, qty } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import type { CustomsDoc } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <tr><td className="w-44 border border-slate-400 px-2 py-1 align-top text-slate-600">{k}</td><td className="border border-slate-400 px-2 py-1">{v || '-'}</td></tr>
);

/** Printable BC form (A4), layout follows the official PIB/PEB print-out sections. */
export default function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const meta = useMeta();
  const { company, app } = meta;
  const L = meta.label;
  const { data: d, error } = useFetch<CustomsDoc>(`/customs-docs/${id}`);
  if (error) return <div className="p-6"><ErrorBox text={error} /></div>;
  if (!d) return <Spinner />;
  const h = d.header;
  const approval = d.events.find((e) => meta.status(e.status).approved);

  return (
    <div className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-between px-4 print:hidden">
        <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="size-4" />Kembali</Button>
        <Button onClick={() => window.print()}><Printer className="size-4" />Cetak / Simpan PDF</Button>
      </div>
      <article className="relative mx-auto max-w-[210mm] bg-white p-[12mm] text-[11px] leading-snug text-black shadow print:max-w-none print:p-0 print:shadow-none">
        {!meta.status(d.status).approved && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-7xl font-bold uppercase tracking-widest text-slate-200/70 [transform:rotate(-30deg)]">{meta.status(d.status).label}</div>
        )}
        <header className="relative border-b-2 border-black pb-2 text-center">
          <p className="text-[10px]">{app.printHeader}</p>
          <h1 className="mt-1 text-sm font-bold uppercase">{d.type.title}</h1>
          <p className="font-semibold">{d.type.label.toUpperCase()}</p>
        </header>
        <table className="relative mt-3 w-full border-collapse">
          <tbody>
            <Row k="Nomor Pengajuan" v={<span className="font-mono">{aju(d.ajuNumber)}</span>} />
            <Row k="Nomor / Tgl Pendaftaran" v={d.registrationNumber ? `${d.registrationNumber} / ${date(d.registrationDate)}` : null} />
            <Row k="Kantor Pabean" v={`${d.officeCode} – ${L('kantor', d.officeCode)}`} />
            <Row k="Pengusaha TPB" v={`${company.name.toUpperCase()} · NPWP ${company.npwp} · Izin KB ${company.izinKb} · ${company.address}`} />
            <Row k={meta.direction(d.type.direction).partyLabel} v={`${d.partner.name}${d.partner.npwp ? ` · NPWP ${d.partner.npwp}` : ''} · ${d.partner.address ?? ''} (${d.partner.countryCode})`} />
            <Row k="Sarana Pengangkut" v={[h.caraAngkut && L('cara_angkut', h.caraAngkut), h.pengangkut, h.nomorVoyage ?? h.nomorPolisi].filter(Boolean).join(' · ')} />
            {(h.pelabuhanMuat || h.pelabuhanTujuan) && <Row k="Pelabuhan Muat / Tujuan" v={`${L('pelabuhan', h.pelabuhanMuat)} / ${L('pelabuhan', h.pelabuhanTujuan)}`} />}
            <Row k="Kemasan / Bruto / Netto" v={`${h.kemasan?.jumlah ?? '-'} ${h.kemasan?.jenis ? L('kemasan', h.kemasan.jenis) : ''} / ${num(h.bruto, 2)} kg / ${num(h.netto, 2)} kg`} />
            {h.kontainer?.length ? <Row k="Kontainer" v={h.kontainer.map((k) => `${k.nomor} (${L('ukuran_kontainer', k.ukuran)} ${k.tipe})`).join(', ')} /> : null}
            <Row k="Valuta / NDPBM" v={`${d.currency} / ${num(d.kurs, 2)}${h.incoterm ? ` · ${h.incoterm}` : ''}`} />
            <Row k="Dokumen Pelengkap" v={(h.dokumen ?? []).map((x) => `${L('jenis_dokumen', x.jenis)} ${x.nomor} (${date(x.tanggal)})`).join('; ')} />
            {h.jaminan && <Row k="Jaminan" v={`${L('jenis_jaminan', h.jaminan.jenis)} ${h.jaminan.nomor ?? ''} · ${h.jaminan.penjamin ?? ''} · ${idr(h.jaminan.nilai)} · JT ${date(h.jaminan.jatuhTempo)}`} />}
          </tbody>
        </table>

        <h2 className="relative mt-4 mb-1 font-bold">DATA BARANG</h2>
        <table className="relative w-full border-collapse">
          <thead><tr className="bg-slate-100">{['No', 'Pos Tarif / HS', 'Uraian Barang', 'Jumlah & Satuan', 'Harga Satuan', `Nilai (${d.currency})`].map((t) => <th key={t} className="border border-slate-400 px-2 py-1 text-left font-semibold">{t}</th>)}</tr></thead>
          <tbody>
            {d.lines.map((l, i) => (
              <tr key={l.id}>
                <td className="border border-slate-400 px-2 py-1">{i + 1}</td>
                <td className="border border-slate-400 px-2 py-1 font-mono">{l.hsCode}</td>
                <td className="border border-slate-400 px-2 py-1">{l.itemName}<br /><span className="text-slate-500">Kode: {l.itemCode}</span></td>
                <td className="border border-slate-400 px-2 py-1 text-right">{qty(l.qty)} {l.uom}</td>
                <td className="border border-slate-400 px-2 py-1 text-right">{num(l.unitPrice, 4)}</td>
                <td className="border border-slate-400 px-2 py-1 text-right">{num(Number(l.qty) * Number(l.unitPrice), 2)}</td>
              </tr>
            ))}
            <tr className="font-semibold"><td colSpan={5} className="border border-slate-400 px-2 py-1 text-right">Jumlah</td><td className="border border-slate-400 px-2 py-1 text-right">{num(d.totalValue, 2)}</td></tr>
          </tbody>
        </table>

        {d.duties && meta.duty(d.type.duty).charged && (
          <table className="relative mt-4 w-1/2 border-collapse">
            <tbody>
              <Row k="Bea Masuk" v={idr(d.duties.bm)} /><Row k="PPN" v={idr(d.duties.ppn)} /><Row k="PPh Pasal 22" v={idr(d.duties.pph)} />
              <Row k={`Total (${d.duties.treatment})`} v={<b>{idr(d.duties.total)}</b>} />
            </tbody>
          </table>
        )}

        <footer className="relative mt-8 grid grid-cols-2 gap-8">
          <div className="text-[10px] text-slate-600">
            {approval ? <>Respon: <b>{approval.code}</b> · {approval.message}<br />{dateTime(approval.createdAt)}</> : 'Belum ada persetujuan dari Bea dan Cukai.'}
            {app.printFootnote && <p className="mt-2 italic">{app.printFootnote}</p>}
          </div>
          <div className="text-center">
            <p>{company.city}, {date(d.submittedAt ?? d.createdAt)}</p>
            <p>Pengusaha TPB</p>
            <div className="h-14" />
            <p className="font-semibold underline">{company.signatory.name}</p>
            <p className="text-[10px]">{company.signatory.title}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
