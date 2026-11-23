'use client';
import { MasterCodePage } from '@/components/master-code-page';
import { Badge } from '@/components/ui';
import { TONES, useMeta, type StatusRow } from '@/lib/meta';

const tones = TONES.map((t) => ({ value: t, label: t }));
const FLAGS: { key: keyof StatusRow; label: string; hint: string }[] = [
  { key: 'initial', label: 'Status awal', hint: 'Dokumen baru dan dokumen yang diubah kembali ke status ini. Harus tepat satu.' },
  { key: 'editable', label: 'Boleh diubah / dikirim', hint: 'Dokumen di status ini boleh diedit, dihapus, dan dikirim (ulang) ke CEISA.' },
  { key: 'inFlight', label: 'Menunggu respon CEISA', hint: 'Dokumen diproses otomatis oleh mock CEISA dan tampil sebagai "Proses di CEISA".' },
  { key: 'registered', label: 'Nomor pendaftaran terbit', hint: 'Nomor dan tanggal pendaftaran dicatat saat dokumen mencapai status ini.' },
  { key: 'approved', label: 'Disetujui (final)', hint: 'Stok dibukukan saat dokumen mencapai status ini.' },
  { key: 'rejected', label: 'Ditolak (final)', hint: 'Dokumen berhenti dan boleh diperbaiki lalu dikirim ulang.' },
];

/** Master table `document_statuses`: the document lifecycle is these flags; the code never refers to a status by name. */
export default function StatusPage() {
  const meta = useMeta();
  return (
    <MasterCodePage<StatusRow>
      title="Status Dokumen" desc="Master status dokumen BC. Alur dokumen ditentukan oleh flag di bawah, bukan oleh nama status."
      path="/document-statuses" onChanged={meta.reload}
      columns={[
        { key: 'code', sortable: true, label: 'Kode', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { key: 'name', sortable: true, label: 'Nama', render: (r) => <Badge tone={r.tone}>{r.name}</Badge> },
        { key: 'flags', label: 'Flag', render: (r) => <span className="flex flex-wrap gap-1">{FLAGS.filter((f) => r[f.key]).map((f) => <Badge key={f.key}>{f.label}</Badge>)}</span> },
      ]}
      fields={[
        { name: 'code', label: 'Kode', required: true, lockOnEdit: true, hint: 'Huruf kecil, angka, underscore. Tidak dapat diubah setelah dibuat.' },
        { name: 'name', label: 'Nama', required: true },
        { name: 'tone', label: 'Warna label', type: 'select', options: tones, required: true },
        { name: 'sort', label: 'Urutan', type: 'number' },
        ...FLAGS.map((f) => ({ name: f.key, label: f.label, type: 'boolean' as const, hint: f.hint, full: true })),
      ]}
    />
  );
}
