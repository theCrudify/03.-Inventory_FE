'use client';
import { MasterCodePage } from '@/components/master-code-page';
import { Badge } from '@/components/ui';
import { TONES, useMeta, type RoleRow } from '@/lib/meta';

const tones = TONES.map((t) => ({ value: t, label: t }));

/** Master table `roles`: permissions are columns, so a new role needs no code change. */
export default function RolePage() {
  const meta = useMeta();
  return (
    <MasterCodePage<RoleRow>
      title="Role" desc="Master role dan hak aksesnya. Role baru langsung bisa dipilih di halaman Pengguna."
      path="/roles" onChanged={meta.reload}
      columns={[
        { key: 'code', sortable: true, label: 'Kode', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { key: 'name', sortable: true, label: 'Nama', render: (r) => <Badge tone={r.tone}>{r.name}</Badge> },
        { key: 'canWrite', sortable: true, label: 'Boleh mengubah data', render: (r) => (r.canWrite ? 'Ya' : 'Tidak') },
        { key: 'isAdmin', sortable: true, label: 'Admin', render: (r) => (r.isAdmin ? 'Ya' : 'Tidak') },
        { key: 'description', sortable: true, label: 'Keterangan', className: 'max-w-sm truncate' },
      ]}
      fields={[
        { name: 'code', label: 'Kode', required: true, lockOnEdit: true, hint: 'Huruf kecil, angka, underscore. Tidak dapat diubah setelah dibuat.' },
        { name: 'name', label: 'Nama', required: true },
        { name: 'description', label: 'Keterangan', full: true },
        { name: 'tone', label: 'Warna label', type: 'select', options: tones, required: true },
        { name: 'sort', label: 'Urutan', type: 'number' },
        { name: 'canWrite', label: 'Boleh membuat/mengubah/mengirim dokumen dan master data', type: 'boolean', full: true },
        { name: 'isAdmin', label: 'Admin: pengguna, role, status, referensi, profil, audit log', type: 'boolean', full: true },
      ]}
    />
  );
}
