'use client';
import { useState } from 'react';
import { Button, Card, CardHeader, ErrorBox, Field, Input, PageHeader, Textarea, toast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useMeta, type AppInfo, type Company } from '@/lib/meta';

/** Admin editor for the `settings` table (company profile + app branding). */
export default function PerusahaanPage() {
  const meta = useMeta();
  const [company, setCompany] = useState<Company>(meta.company);
  const [app, setApp] = useState<AppInfo>(meta.app);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'company' | 'app' | null>(null);

  async function save(key: 'company' | 'app', value: unknown) {
    setBusy(key); setError('');
    try {
      await api(`/settings/${key}`, { method: 'PUT', json: value });
      toast('Pengaturan disimpan. Muat ulang halaman untuk melihat perubahan di seluruh aplikasi.');
    } catch (e) {
      const a = e as ApiError;
      setError(a.message + (a.errors ? ': ' + a.errors.map((x) => `${x.path} ${x.message}`).join('; ') : ''));
    } finally { setBusy(null); }
  }
  const c = (k: keyof Company) => ({ value: String(company[k] ?? ''), onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, [k]: e.target.value }) });
  const a = (k: 'name' | 'subtitle' | 'tagline' | 'environmentLabel' | 'footnote' | 'printHeader' | 'printFootnote') =>
    ({ value: app[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setApp({ ...app, [k]: e.target.value || null }) });

  return (
    <>
      <PageHeader title="Profil Perusahaan & Aplikasi" desc="Dipakai di dokumen cetak, nomor aju CEISA, tampilan aplikasi, dan halaman login." />
      {error && <div className="mb-4"><ErrorBox text={error} /></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pengusaha TPB" />
          <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save('company', company); }}>
            <Field label="Nama Perusahaan" required className="sm:col-span-2"><Input required {...c('name')} /></Field>
            <Field label="NPWP" required><Input required {...c('npwp')} /></Field>
            <Field label="No. Izin Kawasan Berikat" required><Input required {...c('izinKb')} /></Field>
            <Field label="ID Perusahaan CEISA" required hint="6 digit, bagian dari nomor aju"><Input required {...c('companyId')} /></Field>
            <Field label="Zona Waktu" required hint="IANA, mis. Asia/Jakarta"><Input required {...c('timezone')} /></Field>
            <Field label="Alamat" required className="sm:col-span-2"><Input required {...c('address')} /></Field>
            <Field label="Kota (tempat tanda tangan)" required><Input required {...c('city')} /></Field>
            <div />
            <Field label="Penandatangan" required><Input required value={company.signatory.name} onChange={(e) => setCompany({ ...company, signatory: { ...company.signatory, name: e.target.value } })} /></Field>
            <Field label="Jabatan" required><Input required value={company.signatory.title} onChange={(e) => setCompany({ ...company, signatory: { ...company.signatory, title: e.target.value } })} /></Field>
            <div className="sm:col-span-2"><Button type="submit" loading={busy === 'company'}>Simpan Profil</Button></div>
          </form>
        </Card>
        <Card>
          <CardHeader title="Aplikasi" />
          <form className="grid gap-3 p-5" onSubmit={(e) => { e.preventDefault(); save('app', app); }}>
            <Field label="Nama Aplikasi" required><Input required {...a('name')} /></Field>
            <Field label="Subjudul"><Input {...a('subtitle')} /></Field>
            <Field label="Tagline (halaman login)"><Input {...a('tagline')} /></Field>
            <Field label="Deskripsi (halaman login)"><Textarea value={app.description} onChange={(e) => setApp({ ...app, description: e.target.value })} /></Field>
            <Field label="Label lingkungan (topbar)" hint="Kosongkan untuk menyembunyikan"><Input {...a('environmentLabel')} /></Field>
            <Field label="Kop dokumen cetak"><Input {...a('printHeader')} /></Field>
            <Field label="Catatan kaki cetak"><Input {...a('printFootnote')} /></Field>
            <div><Button type="submit" loading={busy === 'app'}>Simpan Aplikasi</Button></div>
          </form>
        </Card>
      </div>
    </>
  );
}
