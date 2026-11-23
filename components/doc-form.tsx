'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api, ApiError, type Paged } from '@/lib/api';
import { idr, money, num, today } from '@/lib/format';
import { useMeta, type BcType } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { CustomsDoc, Header, TradeDoc } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';
import { useItems, usePartners } from '@/lib/use-options';
import { Button, Card, CardHeader, DateField, ErrorBox, Field, Input, PageHeader, Select, toast } from './ui';

type Line = { itemId: string; hsCode: string; qty: string; unitPrice: string };
type Form = { partnerId: string; tradeDocId: string; officeCode: string; currency: string; kurs: string; header: Header; lines: Line[] };
type Transport = { usesPort?: boolean; usesContainer?: boolean; usesPlate?: boolean };
type Tariff = { bm: number; ppn: number; pph: number };

const emptyLine = (): Line => ({ itemId: '', hsCode: '', qty: '', unitPrice: '' });

export function DocForm({ bc, existing }: { bc: BcType; existing?: CustomsDoc }) {
  const router = useRouter();
  const meta = useMeta();
  const { t } = usePrefs();
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
    const tr = trade.find((x) => String(x.id) === id);
    if (!tr) return setF((s) => ({ ...s, tradeDocId: '' }));
    setF((s) => ({
      ...s, tradeDocId: id, partnerId: String(tr.partnerId), currency: tr.currency, kurs: kursOf(tr.currency),
      lines: tr.lines.map((l) => ({ itemId: String(l.itemId), hsCode: items.find((i) => i.id === l.itemId)?.hsCode ?? '', qty: String(l.qty), unitPrice: String(l.unitPrice) })),
      header: {
        ...s.header, incoterm: tr.incoterm ?? s.header.incoterm,
        dokumen: [{ jenis: meta.metaOf<{ documentType?: string }>('jenis_sumber', tr.kind).documentType ?? first('jenis_dokumen'), nomor: tr.number, tanggal: tr.date }, ...(s.header.dokumen ?? []).filter((d) => d.nomor !== tr.number)],
      },
    }));
  }

  const totals = useMemo(() => {
    const kurs = Number(f.kurs) || 0;
    let value = 0, bm = 0, ppn = 0, pph = 0;
    for (const l of f.lines) {
      const tr = meta.metaOf<Partial<Tariff>>('hs', l.hsCode);
      const v = (Number(l.qty) * Number(l.unitPrice) || 0) * kurs;
      const lineBm = v * (tr.bm ?? 0) / 100;
      value += v; bm += lineBm; ppn += (v + lineBm) * (tr.ppn ?? 0) / 100; pph += (v + lineBm) * (tr.pph ?? 0) / 100;
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
      toast(existing ? t('common.saved') : t('doc.draftCreated'));
      router.push(`/dokumen/${bc.slug}/${doc.id}`);
    } catch (err) {
      setError((err as Error).message);
      setErrors((err as ApiError).errors ?? []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  }

  const docList = h.dokumen ?? [], conts = h.kontainer ?? [];
  const opt = meta.options;
  const sections = [
    { id: 'sec-1', n: 1, title: t('form.secGeneral') },
    { id: 'sec-2', n: 2, title: t('form.secTransport') },
    { id: 'sec-3', n: 3, title: t('form.secPackaging') },
    ...(bc.requiresGuarantee ? [{ id: 'sec-4', n: 4, title: t('form.secGuarantee') }] : []),
    { id: 'sec-5', n: bc.requiresGuarantee ? 5 : 4, title: t('form.secSupporting') },
    { id: 'sec-6', n: bc.requiresGuarantee ? 6 : 5, title: t('form.secItems') },
  ];

  return (
    <form onSubmit={save}>
      <PageHeader back={`/dokumen/${bc.slug}`} title={`${existing ? t('form.editTitle') : t('form.createTitle')} ${bc.label}`} desc={bc.title}
        actions={<><Button variant="secondary" href={`/dokumen/${bc.slug}`}>{t('common.cancel')}</Button><Button type="submit" loading={busy}>{t('form.saveDraft')}</Button></>} />
      {error && <div className="mb-4"><ErrorBox text={error + (errors.length ? ': ' + errors.map((x) => `${x.path} ${x.message}`).join('; ') : '')} /></div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card id="sec-1">
            <CardHeader title={t('form.secGeneral')} />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Field label={`${meta.label('jenis_sumber', bc.sourceDoc)} (${t('common.optional')})`} hint={t('form.autoFillHint')} className="sm:col-span-2">
                <Select value={f.tradeDocId} onChange={(e) => applyTrade(e.target.value)} placeholder={t('form.noSourceDoc')}
                  options={trade.map((tr) => ({ value: tr.id, label: `${tr.number} · ${tr.partnerName}` }))} />
              </Field>
              <Field label={`${dir.partyLabel} (${meta.label('jenis_mitra', bc.partnerKind)})`} required>
                <Select required value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })} placeholder={t('form.selectPartner')} options={partners.map((p) => ({ value: p.id, label: `${p.name} (${p.countryCode})` }))} />
              </Field>
              <Field label={t('doc.customsOffice')} required><Select required value={f.officeCode} onChange={(e) => setF({ ...f, officeCode: e.target.value })} options={opt('kantor')} /></Field>
              <Field label={t('form.currency')} required><Select required value={f.currency} onChange={(e) => setCurrency(e.target.value)} options={opt('valuta')} /></Field>
              <Field label={t('form.kurs')} required hint={t('form.kursHint')}><Input required type="number" step="any" min="0" value={f.kurs} onChange={(e) => setF({ ...f, kurs: e.target.value })} /></Field>
              {bc.international
                ? <Field label={t('form.incoterm')}><Select value={h.incoterm ?? ''} onChange={(e) => setH({ incoterm: e.target.value })} placeholder="-" options={opt('incoterm')} /></Field>
                : <Field label={t('form.destDelivery')} className="sm:col-span-2"><Input value={h.tujuanPengiriman ?? ''} onChange={(e) => setH({ tujuanPengiriman: e.target.value })} /></Field>}
            </div>
          </Card>

          <Card id="sec-2">
            <CardHeader title={t('form.secTransport')} />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Field label={t('form.transportMode')}><Select value={h.caraAngkut ?? ''} onChange={(e) => setH({ caraAngkut: e.target.value })} options={opt('cara_angkut', false)} /></Field>
              <Field label={t('form.carrierName')} required hint={t('form.carrierHint')}>
                <Input value={h.pengangkut ?? ''} onChange={(e) => setH({ pengangkut: e.target.value })} />
              </Field>
              {transport.usesPlate
                ? <Field label={t('form.plateNo')}><Input value={h.nomorPolisi ?? ''} onChange={(e) => setH({ nomorPolisi: e.target.value })} /></Field>
                : <Field label={t('form.voyageNo')}><Input value={h.nomorVoyage ?? ''} onChange={(e) => setH({ nomorVoyage: e.target.value })} /></Field>}
              {bc.international && <>
                <Field label={dir.countryLabel}>
                  <Select value={String((h as Record<string, unknown>)[dir.countryField] ?? '')} placeholder="-" options={opt('negara')}
                    onChange={(e) => setH({ [dir.countryField]: e.target.value } as Partial<Header>)} />
                </Field>
                {transport.usesPort && <>
                  <Field label={t('form.loadPort')}><Select value={h.pelabuhanMuat ?? ''} onChange={(e) => setH({ pelabuhanMuat: e.target.value })} placeholder="-" options={opt('pelabuhan')} /></Field>
                  <Field label={t('form.destPort')}><Select value={h.pelabuhanTujuan ?? ''} onChange={(e) => setH({ pelabuhanTujuan: e.target.value })} placeholder="-" options={opt('pelabuhan')} /></Field>
                </>}
              </>}
            </div>
          </Card>

          <Card id="sec-3">
            <CardHeader title={t('form.secPackaging')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-5">
              <Field label={t('form.packCount')}><Input type="number" min="0" value={h.kemasan?.jumlah ?? ''} onChange={(e) => setH({ kemasan: { ...h.kemasan, jumlah: Number(e.target.value) } })} /></Field>
              <Field label={t('form.packType')}><Select value={h.kemasan?.jenis ?? ''} onChange={(e) => setH({ kemasan: { ...h.kemasan, jenis: e.target.value } })} options={opt('kemasan')} /></Field>
              <Field label={t('form.bruto')}><Input type="number" step="any" min="0" value={h.bruto ?? ''} onChange={(e) => setH({ bruto: Number(e.target.value) })} /></Field>
              <Field label={t('form.netto')}><Input type="number" step="any" min="0" value={h.netto ?? ''} onChange={(e) => setH({ netto: Number(e.target.value) })} /></Field>
            </div>
            {transport.usesContainer && (
              <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{t('form.containers')} ({conts.length})</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setH({ kontainer: [...conts, { nomor: '', ukuran: first('ukuran_kontainer'), tipe: first('tipe_kontainer') }] })}>
                    <Plus className="size-3.5" />{t('common.add')}
                  </Button>
                </div>
                <div className="space-y-2">
                  {conts.map((k, i) => (
                    <div key={i} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 sm:border-0 sm:bg-transparent sm:p-0 sm:grid sm:grid-cols-[2rem_1fr_8rem_6rem_auto] sm:items-center sm:gap-2">
                      <span className="hidden sm:block text-center font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">#{i + 1}</span>
                      <div className="space-y-1 sm:space-y-0">
                        <span className="text-[11px] font-medium text-slate-500 sm:hidden">No. Kontainer #{i + 1}</span>
                        <Input aria-label={`Nomor kontainer ${i + 1}`} placeholder="Nomor kontainer" value={k.nomor} onChange={(e) => setH({ kontainer: conts.map((x, j) => (j === i ? { ...x, nomor: e.target.value } : x)) })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:contents mt-2 sm:mt-0">
                        <Select aria-label={`Ukuran ${i + 1}`} value={k.ukuran} onChange={(e) => setH({ kontainer: conts.map((x, j) => (j === i ? { ...x, ukuran: e.target.value } : x)) })} options={opt('ukuran_kontainer', false)} />
                        <Select aria-label={`Tipe ${i + 1}`} value={k.tipe} onChange={(e) => setH({ kontainer: conts.map((x, j) => (j === i ? { ...x, tipe: e.target.value } : x)) })} options={meta.refs('tipe_kontainer').map((r) => ({ value: r.code, label: r.code }))} />
                      </div>
                      <div className="flex justify-end pt-1 sm:pt-0">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setH({ kontainer: conts.filter((_, j) => j !== i) })} aria-label={t('common.delete')}><Trash2 className="size-4 text-red-500" /></Button>
                      </div>
                    </div>
                  ))}
                  {!conts.length && <p className="text-xs text-slate-400 dark:text-slate-500">{t('form.noContainers')}</p>}
                </div>
              </div>
            )}
          </Card>

          {bc.requiresGuarantee && (
            <Card id="sec-4">
              <CardHeader title={t('form.secGuarantee')} desc={t('form.guaranteeDesc', { label: bc.label })} />
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <Field label={t('form.guaranteeType')}><Select value={h.jaminan?.jenis ?? ''} placeholder="-" onChange={(e) => setH({ jaminan: { ...h.jaminan, jenis: e.target.value } })} options={opt('jenis_jaminan', false)} /></Field>
                <Field label={t('form.guaranteeNo')}><Input value={h.jaminan?.nomor ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, nomor: e.target.value } })} /></Field>
                <Field label={t('form.guarantor')}><Input value={h.jaminan?.penjamin ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, penjamin: e.target.value } })} /></Field>
                <Field label={t('form.guaranteeValue')}><Input type="number" min="0" value={h.jaminan?.nilai ?? ''} onChange={(e) => setH({ jaminan: { ...h.jaminan, nilai: Number(e.target.value) } })} /></Field>
                <Field label={t('form.dueDate')}><DateField value={h.jaminan?.jatuhTempo ?? ''} onChange={(v) => setH({ jaminan: { ...h.jaminan, jatuhTempo: v } })} /></Field>
              </div>
            </Card>
          )}

          <Card id="sec-5">
            <CardHeader title={t('form.secSupporting')} action={<Button type="button" variant="ghost" size="sm" onClick={() => setH({ dokumen: [...docList, { jenis: first('jenis_dokumen'), nomor: '', tanggal: today() }] })}><Plus className="size-3.5" />{t('common.add')}</Button>} />
            <div className="space-y-2 p-5">
              {docList.map((d, i) => (
                <div key={i} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 sm:border-0 sm:bg-transparent sm:p-0 sm:grid sm:items-center sm:gap-2 sm:grid-cols-[2rem_13rem_1fr_9.5rem_auto]">
                  <span className="hidden sm:block text-center font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">#{i + 1}</span>
                  <div className="space-y-1 sm:space-y-0">
                    <span className="text-[11px] font-medium text-slate-500 sm:hidden">Jenis Dokumen #{i + 1}</span>
                    <Select aria-label={`Jenis dokumen ${i + 1}`} value={d.jenis} onChange={(e) => setH({ dokumen: docList.map((x, j) => (j === i ? { ...x, jenis: e.target.value } : x)) })} options={opt('jenis_dokumen', false)} />
                  </div>
                  <div className="space-y-1 sm:space-y-0 mt-2 sm:mt-0">
                    <span className="text-[11px] font-medium text-slate-500 sm:hidden">{t('trade.number')}</span>
                    <Input aria-label={`Nomor dokumen ${i + 1}`} placeholder={t('trade.number')} value={d.nomor} onChange={(e) => setH({ dokumen: docList.map((x, j) => (j === i ? { ...x, nomor: e.target.value } : x)) })} />
                  </div>
                  <div className="space-y-1 sm:space-y-0 mt-2 sm:mt-0">
                    <span className="text-[11px] font-medium text-slate-500 sm:hidden">{t('trade.date')}</span>
                    <DateField aria-label={`Tanggal ${i + 1}`} value={d.tanggal} onChange={(v) => setH({ dokumen: docList.map((x, j) => (j === i ? { ...x, tanggal: v } : x)) })} />
                  </div>
                  <div className="flex justify-end pt-1 sm:pt-0">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setH({ dokumen: docList.filter((_, j) => j !== i) })} aria-label={t('common.delete')}><Trash2 className="size-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
              {!docList.length && <p className="text-xs text-slate-400 dark:text-slate-500">{t('form.noSupportingDocs')}</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <CardHeader title={t('form.secSummary')} />
            <dl className="space-y-2.5 p-5 text-sm">
              <div className="flex justify-between items-center"><dt className="text-slate-500 dark:text-slate-400">{t('form.itemCount')}</dt><dd className="font-semibold text-slate-800 dark:text-slate-200">{f.lines.length} {t('form.pos')}</dd></div>
              <div className="flex justify-between items-center"><dt className="text-slate-500 dark:text-slate-400">{t('doc.value')} ({f.currency})</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(totals.value, f.currency)}</dd></div>
              <div className="flex justify-between items-center rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60"><dt className="font-medium text-slate-700 dark:text-slate-300">{t('doc.customsValue')}</dt><dd className="font-bold tabular-nums text-teal-700 dark:text-teal-400">{idr(totals.idr)}</dd></div>
              {duty.charged && (
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800/80 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('form.dutyEst', { label: duty.label.toLowerCase() })}</div>
                  <div className="flex justify-between text-xs"><dt className="text-slate-500 dark:text-slate-400">{t('form.bm')}</dt><dd className="tabular-nums font-medium">{idr(totals.bm)}</dd></div>
                  <div className="flex justify-between text-xs"><dt className="text-slate-500 dark:text-slate-400">{t('form.ppn')}</dt><dd className="tabular-nums font-medium">{idr(totals.ppn)}</dd></div>
                  <div className="flex justify-between text-xs"><dt className="text-slate-500 dark:text-slate-400">{t('form.pph')}</dt><dd className="tabular-nums font-medium">{idr(totals.pph)}</dd></div>
                </div>
              )}
            </dl>
          </Card>
          <Card className="hidden lg:block overflow-hidden">
            <CardHeader title={t('form.indexProgress')} />
            <ol className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`} className="group flex items-center gap-2.5 px-5 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-teal-300">
                    <span className="font-mono font-bold text-teal-700 group-hover:scale-105 transition-transform dark:text-teal-400">{String(sec.n).padStart(2, '0')}</span>
                    <span className="font-medium">{sec.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card id="sec-6" className="lg:col-span-3">
          <CardHeader title={t('form.secItems')} desc={t('form.itemsDesc')}
            action={
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">{f.lines.length} pos</span>
                <Button type="button" variant="secondary" size="sm" onClick={() => setF({ ...f, lines: [...f.lines, emptyLine()] })}><Plus className="size-3.5" />{t('form.addItem')}</Button>
              </div>
            } />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-slate-200/90 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="w-12 px-4 py-3 text-center">{t('common.no')}</th><th className="px-3 py-3">{t('form.colItem')}</th><th className="w-40 px-3 py-3">{t('form.colHs')}</th>
                <th className="w-36 px-3 py-3 text-right">{t('form.colQty')}</th><th className="w-36 px-3 py-3 text-right">{t('form.colPrice')}</th><th className="w-36 px-3 py-3 text-right">{t('form.colSubtotal')}</th><th className="w-12 px-3 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {f.lines.map((l, i) => {
                  const it = items.find((x) => String(x.id) === l.itemId);
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-400 dark:text-slate-500">{i + 1}</td>
                      <td className="px-3 py-2.5"><Select aria-label={`Barang ${i + 1}`} required value={l.itemId} placeholder={t('form.selectItem')} options={items.map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))}
                        onChange={(e) => setLine(i, { itemId: e.target.value, hsCode: items.find((x) => String(x.id) === e.target.value)?.hsCode ?? '' })} /></td>
                      <td className="px-3 py-2.5"><Select aria-label={`HS ${i + 1}`} className="font-mono text-xs" value={l.hsCode} placeholder="-" onChange={(e) => setLine(i, { hsCode: e.target.value })} options={meta.refs('hs').map((r) => ({ value: r.code, label: r.code }))} /></td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><Input aria-label={`Jumlah ${i + 1}`} required type="number" step="any" min="0" className="text-right" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} /><span className="w-9 text-xs font-medium text-slate-500 dark:text-slate-400">{it?.uom}</span></div></td>
                      <td className="px-3 py-2.5"><Input aria-label={`Harga ${i + 1}`} required type="number" step="any" min="0" className="text-right" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} /></td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{num(Number(l.qty) * Number(l.unitPrice) || 0, 2)}</td>
                      <td className="px-3 py-2.5 text-center"><Button type="button" variant="ghost" size="sm" disabled={f.lines.length === 1} onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })} aria-label={t('common.delete')}><Trash2 className="size-4 text-red-500" /></Button></td>
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
