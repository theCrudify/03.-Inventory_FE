'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api, ApiError, type Paged } from '@/lib/api';
import { idr, money, num, today } from '@/lib/format';
import { useMeta, type BcType } from '@/lib/meta';
import type { CustomsDoc, Header, TradeDoc } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';
import { useItems, usePartners } from '@/lib/use-options';
import { Button, Card, CardHeader, ErrorBox, Field, Input, PageHeader, Select, toast } from './ui';

type Line = { itemId: string; hsCode: string; qty: string; unitPrice: string };
type Form = { partnerId: string; tradeDocId: string; officeCode: string; currency: string; kurs: string; header: Header; lines: Line[] };
type Transport = { usesPort?: boolean; usesContainer?: boolean; usesPlate?: boolean };
type Tariff = { bm: number; ppn: number; pph: number };

const emptyLine = (): Line => ({ itemId: '', hsCode: '', qty: '', unitPrice: '' });

export function DocForm({ bc, existing }: { bc: BcType; existing?: CustomsDoc }) {
  const router = useRouter();
  const meta = useMeta();
  const dir = meta.direction(bc.direction);
  const duty = meta.duty(bc.duty);
  const partners = usePartners(bc.partnerKind);
  const items = useItems();
  const trade = useFetch<Paged<TradeDoc>>(`/trade-docs?kind=${bc.sourceDoc}&pageSize=100`).data?.data ?? [];
  const first = (type: string) => meta.refs(type)[0]?.code ?? '';
  const kursOf = (cur: string) => String(meta.metaOf<{ kurs?: number }>('valuta', cur).kurs ?? '');
  const firstTransport = meta.refs('cara_angkut').find((r) => !!(r.meta as Transport)?.usesPort === bc.international)?.code ?? first('cara_angkut');

  const [f, setF] = useState<Form>(() => existing ? {
    partnerId: String(existing.partnerId), tradeDocId: existing.tradeDocId ? String(existing.tradeDocId) : '', officeCode: existing.officeCode,
    currency: existing.currency, kurs: String(Number(existing.kurs)), header: existing.header,
    lines: existing.lines.map((l) => ({ itemId: String(l.itemId), hsCode: l.hsCode ?? '', qty: String(Number(l.qty)), unitPrice: String(Number(l.unitPrice)) })),
  } : {
    partnerId: '', tradeDocId: '', officeCode: bc.defaultOffice, currency: first('valuta'), kurs: kursOf(first('valuta')),
    header: { caraAngkut: firstTransport, kemasan: { jenis: first('kemasan') }, dokumen: [], kontainer: [] }, lines: [emptyLine()],
  });
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const h = f.header;
  const transport = meta.metaOf<Transport>('cara_angkut', h.caraAngkut);
  const setH = (patch: Partial<Header>) => setF((s) => ({ ...s, header: { ...s.header, ...patch } }));
  const setLine = (i: number, patch: Partial<Line>) => setF((s) => ({ ...s, lines: s.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const setCurrency = (currency: string) => setF((s) => ({ ...s, currency, kurs: kursOf(currency) }));

  function applyTrade(id: string) {
    const t = trade.find((x) => String(x.id) === id);
    if (!t) return setF((s) => ({ ...s, tradeDocId: '' }));
    setF((s) => ({
      ...s, tradeDocId: id, partnerId: String(t.partnerId), currency: t.currency, kurs: kursOf(t.currency),
      lines: t.lines.map((l) => ({ itemId: String(l.itemId), hsCode: items.find((i) => i.id === l.itemId)?.hsCode ?? '', qty: String(l.qty), unitPrice: String(l.unitPrice) })),
      header: {
        ...s.header, incoterm: t.incoterm ?? s.header.incoterm,
        dokumen: [{ jenis: meta.metaOf<{ documentType?: string }>('jenis_sumber', t.kind).documentType ?? first('jenis_dokumen'), nomor: t.number, tanggal: t.date }, ...(s.header.dokumen ?? []).filter((d) => d.nomor !== t.number)],
      },
    }));
  }

  const totals = useMemo(() => {
    const kurs = Number(f.kurs) || 0;
    let value = 0, bm = 0, ppn = 0, pph = 0;
    for (const l of f.lines) {
      const t = meta.metaOf<Partial<Tariff>>('hs', l.hsCode);
      const v = (Number(l.qty) * Number(l.unitPrice) || 0) * kurs;
      const lineBm = v * (t.bm ?? 0) / 100;
      value += v; bm += lineBm; ppn += (v + lineBm) * (t.ppn ?? 0) / 100; pph += (v + lineBm) * (t.pph ?? 0) / 100;
    }
    return { value: kurs ? value / kurs : 0, idr: value, bm, ppn, pph };
  }, [f.lines, f.kurs, meta]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors([]);
    const body = {
      bcType: bc.code, partnerId: Number(f.partnerId), tradeDocId: f.tradeDocId ? Number(f.tradeDocId) : null, officeCode: f.officeCode,
      currency: f.currency, kurs: Number(f.kurs), header: f.header,
      lines: f.lines.map((l) => ({ itemId: Number(l.itemId), hsCode: l.hsCode || null, qty: Number(l.qty), unitPrice: Number(l.unitPrice) })),
    };
    try {
      const doc = existing
        ? await api<CustomsDoc>(`/customs-docs/${existing.id}`, { method: 'PUT', json: body })
        : await api<CustomsDoc>('/customs-docs', { method: 'POST', json: body });
      toast(existing ? 'Perubahan disimpan' : 'Draft dokumen dibuat');
      router.push(`/dokumen/${bc.slug}/${doc.id}`);
    } catch (err) {
      setError((err as Error).message);
      setErrors((err as ApiError).errors ?? []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  }

  const docList = h.dokumen ?? [], conts = h.kontainer ?? [];
  const opt = meta.options;
  return (
    <form onSubmit={save}>
      <PageHeader back={`/dokumen/${bc.slug}`} title={`${existing ? 'Ubah' : 'Buat'} ${bc.label}`} desc={bc.title}
        actions={<><Button variant="secondary" href={`/dokumen/${bc.slug}`}>Batal</Button><Button type="submit" loading={busy}>Simpan Draft</Button></>} />
      {error && <div className="mb-4"><ErrorBox text={error + (errors.length ? ': ' + errors.map((x) => `${x.path} ${x.message}`).join('; ') : '')} /></div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Data Umum" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Field label={`${meta.label('jenis_sumber', bc.sourceDoc)} (opsional)`} hint="Isi otomatis mitra, valuta, dan barang" className="sm:col-span-2">
                <Select value={f.tradeDocId} onChange={(e) => applyTrade(e.target.value)} placeholder="— Tanpa sumber dokumen —"
                  options={trade.map((t) => ({ value: t.id, label: `${t.number} · ${t.partnerName}` }))} />
              </Field>
              <Field label={`${dir.partyLabel} (${meta.label('jenis_mitra', bc.partnerKind)})`} required>
                <Select required value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })} placeholder="Pilih mitra" options={partners.map((p) => ({ value: p.id, label: `${p.name} (${p.countryCode})` }))} />
              </Field>
              <Field label="Kantor Pabean" required><Select required value={f.officeCode} onChange={(e) => setF({ ...f, officeCode: e.target.value })} options={opt('kantor')} /></Field>
              <Field label="Valuta" required><Select required value={f.currency} onChange={(e) => setCurrency(e.target.value)} options={opt('valuta')} /></Field>
              <Field label="Kurs (NDPBM)" required hint="Default dari master valuta"><Input required type="number" step="any" min="0" value={f.kurs} onChange={(e) => setF({ ...f, kurs: e.target.value })} /></Field>
              {bc.international
                ? <Field label="Incoterm"><Select value={h.incoterm ?? ''} onChange={(e) => setH({ incoterm: e.target.value })} placeholder="-" options={opt('incoterm')} /></Field>
                : <Field label="Tujuan Pengiriman" className="sm:col-span-2"><Input value={h.tujuanPengiriman ?? ''} onChange={(e) => setH({ tujuanPengiriman: e.target.value })} /></Field>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Pengangkutan" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Field label="Cara Angkut"><Select value={h.caraAngkut ?? ''} onChange={(e) => setH({ caraAngkut: e.target.value })} options={opt('cara_angkut', false)} /></Field>
              <Field label="Nama Sarana Pengangkut" required hint="Wajib menurut validasi CEISA">
                <Input value={h.pengangkut ?? ''} onChange={(e) => setH({ pengangkut: e.target.value })} />
              </Field>
              {transport.usesPlate
                ? <Field label="Nomor Polisi"><Input value={h.nomorPolisi ?? ''} onChange={(e) => setH({ nomorPolisi: e.target.value })} /></Field>
                : <Field label="Nomor Voyage / Flight"><Input value={h.nomorVoyage ?? ''} onChange={(e) => setH({ nomorVoyage: e.target.value })} /></Field>}
              {bc.international && <>
                <Field label={dir.countryLabel}>
                  <Select value={String((h as Record<string, unknown>)[dir.countryField] ?? '')} placeholder="-" options={opt('negara')}
                    onChange={(e) => setH({ [dir.countryField]: e.target.value } as Partial<Header>)} />
                </Field>
                {transport.usesPort && <>
                  <Field label="Pelabuhan Muat"><Select value={h.pelabuhanMuat ?? ''} onChange={(e) => setH({ pelabuhanMuat: e.target.value })} placeholder="-" options={opt('pelabuhan')} /></Field>
                  <Field label="Pelabuhan Tujuan"><Select value={h.pelabuhanTujuan ?? ''} onChange={(e) => setH({ pelabuhanTujuan: e.target.value })} placeholder="-" options={opt('pelabuhan')} /></Field>
                </>}
              </>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Kemasan & Kontainer" />
            <div className="grid gap-3 p-5 sm:grid-cols-4">
              <Field label="Jumlah Kemasan"><Input type="number" min="0" value={h.kemasan?.jumlah ?? ''} onChange={(e) => setH({ kemasan: { ...h.kemasan, jumlah: Number(e.target.value) } })} /></Field>
              <Field label="Jenis Kemasan"><Select value={h.kemasan?.jenis ?? ''} onChange={(e) => setH({ kemasan: { ...h.kemasan, jenis: e.target.value } })} options={opt('kemasan')} /></Field>
              <Field label="Bruto (kg)"><Input type="number" step="any" min="0" value={h.bruto ?? ''} onChange={(e) => setH({ bruto: Number(e.target.value) })} /></Field>
              <Field label="Netto (kg)"><Input type="number" step="any" min="0" value={h.netto ?? ''} onChange={(e) => setH({ netto: Number(e.target.value) })} /></Field>
            </div>
            {transport.usesContainer && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">Kontainer
                  <Button type="button" variant="ghost" size="sm" onClick={() => setH({ kontainer: [...conts, { nomor: '', ukuran: first('ukuran_kontainer'), tipe: first('tipe_kontainer') }] })}><Plus className="size-3.5" />Tambah</Button></div>
                {conts.map((k, i) => (
                  <div key={i} className="mb-2 grid grid-cols-[1fr_8rem_6rem_auto] gap-2">
                    <Input aria-label="Nomor kontainer" value={k.nomor} onChange={(e) => setH({ kontainer: conts.map((x, j) => (j === i ? { ...x, nomor: e.target.value } : x)) })} />
                    <Select aria-label="Ukuran" value={k.ukuran} onChange={(e) => setH({ kontainer: conts.map((x, j) => (j === i ? { ...x, ukuran: e.target.value } : x)) })} options={opt('ukuran_kontainer', false)} />
                    <Select aria-label="Tipe" value={k.tipe} onChange={(e) => setH({ kontainer: conts.map((x, j) => (j === i ? { ...x, tipe: e.target.value } : x)) })} options={meta.refs('tipe_kontainer').map((r) => ({ value: r.code, label: r.code }))} />
                    <Button type="button" variant="ghost" onClick={() => setH({ kontainer: conts.filter((_, j) => j !== i) })} aria-label="Hapus kontainer"><Trash2 className="size-4 text-red-500" /></Button>
                  </div>
                ))}
                {!conts.length && <p className="text-xs text-slate-400">Belum ada kontainer.</p>}
              </div>
            )}
          </Card>

          {bc.requiresGuarantee && (
            <Card>
              <CardHeader title="Jaminan" desc={`${bc.label} wajib dilindungi jaminan`} />
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <Field label="Jenis Jaminan"><Select value={h.jaminan?.jenis ?? ''} placeholder="-" onChange={(e) => setH({ jaminan: { ...h.jaminan, jenis: e.target.value } })} options={opt('jenis_jaminan', false)} /></Field>
                <Field label="Nomor Jaminan"><Input value={h.jaminan?.nomor ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, nomor: e.target.value } })} /></Field>
                <Field label="Penjamin"><Input value={h.jaminan?.penjamin ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, penjamin: e.target.value } })} /></Field>
                <Field label="Nilai Jaminan (Rp)"><Input type="number" min="0" value={h.jaminan?.nilai ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, nilai: Number(e.target.value) } })} /></Field>
                <Field label="Jatuh Tempo"><Input type="date" value={h.jaminan?.jatuhTempo ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, jatuhTempo: e.target.value } })} /></Field>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Dokumen Pelengkap" action={<Button type="button" variant="ghost" size="sm" onClick={() => setH({ dokumen: [...docList, { jenis: first('jenis_dokumen'), nomor: '', tanggal: today() }] })}><Plus className="size-3.5" />Tambah</Button>} />
            <div className="space-y-2 p-5">
              {docList.map((d, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[14rem_1fr_10rem_auto]">
                  <Select aria-label="Jenis dokumen" value={d.jenis} onChange={(e) => setH({ dokumen: docList.map((x, j) => (j === i ? { ...x, jenis: e.target.value } : x)) })} options={opt('jenis_dokumen', false)} />
                  <Input aria-label="Nomor dokumen" placeholder="Nomor" value={d.nomor} onChange={(e) => setH({ dokumen: docList.map((x, j) => (j === i ? { ...x, nomor: e.target.value } : x)) })} />
                  <Input aria-label="Tanggal" type="date" value={d.tanggal} onChange={(e) => setH({ dokumen: docList.map((x, j) => (j === i ? { ...x, tanggal: e.target.value } : x)) })} />
                  <Button type="button" variant="ghost" onClick={() => setH({ dokumen: docList.filter((_, j) => j !== i) })} aria-label="Hapus dokumen"><Trash2 className="size-4 text-red-500" /></Button>
                </div>
              ))}
              {!docList.length && <p className="text-xs text-slate-400">Belum ada dokumen pelengkap.</p>}
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader title="Ringkasan" />
            <dl className="space-y-2 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Jumlah barang</dt><dd>{f.lines.length} pos</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Nilai ({f.currency})</dt><dd className="tabular-nums">{money(totals.value, f.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Nilai pabean</dt><dd className="tabular-nums">{idr(totals.idr)}</dd></div>
              {duty.charged && <>
                <div className="border-t border-slate-100 pt-2 text-xs font-medium text-slate-500">Estimasi pungutan ({duty.label.toLowerCase()})</div>
                <div className="flex justify-between"><dt className="text-slate-500">Bea Masuk</dt><dd className="tabular-nums">{idr(totals.bm)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">PPN</dt><dd className="tabular-nums">{idr(totals.ppn)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">PPh Pasal 22</dt><dd className="tabular-nums">{idr(totals.pph)}</dd></div>
              </>}
            </dl>
          </Card>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader title="Data Barang" desc="HS code dari master barang; tarif BM/PPN/PPh dari master HS"
            action={<Button type="button" variant="secondary" size="sm" onClick={() => setF({ ...f, lines: [...f.lines, emptyLine()] })}><Plus className="size-3.5" />Tambah Barang</Button>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="w-10 px-4 py-2.5">No</th><th className="px-2 py-2.5">Barang</th><th className="w-36 px-2 py-2.5">HS Code</th>
                <th className="w-32 px-2 py-2.5 text-right">Jumlah</th><th className="w-32 px-2 py-2.5 text-right">Harga Satuan</th><th className="w-36 px-2 py-2.5 text-right">Subtotal</th><th className="w-12" />
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {f.lines.map((l, i) => {
                  const it = items.find((x) => String(x.id) === l.itemId);
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-2 py-2"><Select aria-label={`Barang ${i + 1}`} required value={l.itemId} placeholder="Pilih barang" options={items.map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))}
                        onChange={(e) => setLine(i, { itemId: e.target.value, hsCode: items.find((x) => String(x.id) === e.target.value)?.hsCode ?? '' })} /></td>
                      <td className="px-2 py-2"><Select aria-label={`HS ${i + 1}`} className="font-mono text-xs" value={l.hsCode} placeholder="-" onChange={(e) => setLine(i, { hsCode: e.target.value })} options={meta.refs('hs').map((r) => ({ value: r.code, label: r.code }))} /></td>
                      <td className="px-2 py-2"><div className="flex items-center gap-1"><Input aria-label={`Jumlah ${i + 1}`} required type="number" step="any" min="0" className="text-right" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} /><span className="w-8 text-xs text-slate-400">{it?.uom}</span></div></td>
                      <td className="px-2 py-2"><Input aria-label={`Harga ${i + 1}`} required type="number" step="any" min="0" className="text-right" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} /></td>
                      <td className="px-2 py-2 text-right tabular-nums">{num(Number(l.qty) * Number(l.unitPrice) || 0, 2)}</td>
                      <td className="px-2 py-2"><Button type="button" variant="ghost" disabled={f.lines.length === 1} onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })} aria-label="Hapus barang"><Trash2 className="size-4 text-red-500" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </form>
  );
}
