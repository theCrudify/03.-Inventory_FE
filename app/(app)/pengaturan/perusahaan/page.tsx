'use client';
import { useState } from 'react';
import { Button, Card, CardHeader, ErrorBox, Field, Input, PageHeader, Textarea, toast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useMeta, type AppInfo, type Company } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';

/** Admin editor for the `settings` table (company profile + app branding). */
export default function PerusahaanPage() {
  const meta = useMeta();
  const { t } = usePrefs();
  const [company, setCompany] = useState<Company>(meta.company);
  const [app, setApp] = useState<AppInfo>(meta.app);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'company' | 'app' | null>(null);

  async function save(key: 'company' | 'app', value: unknown) {
    setBusy(key); setError('');
    try {
      await api(`/settings/${key}`, { method: 'PUT', json: value });
      meta.reload();
      toast(t('company.savedToast'));
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
      <PageHeader title={t('company.title')} desc={t('company.desc')} />
      {error && <div className="mb-4"><ErrorBox text={error} /></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader index={1} title={t('company.secTpb')} />
          <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save('company', company); }}>
            <Field index="1.1" label="Nama Perusahaan" required className="sm:col-span-2"><Input required {...c('name')} /></Field>
            <Field index="1.2" label="NPWP" required><Input required {...c('npwp')} /></Field>
            <Field index="1.3" label="No. Izin Kawasan Berikat" required><Input required {...c('izinKb')} /></Field>
            <Field index="1.4" label="ID Perusahaan CEISA" required hint="6 digit, bagian dari nomor aju"><Input required {...c('companyId')} /></Field>
            <Field index="1.5" label="Zona Waktu" required hint="IANA, mis. Asia/Jakarta"><Input required {...c('timezone')} /></Field>
            <Field index="1.6" label="Alamat" required className="sm:col-span-2"><Input required {...c('address')} /></Field>
            <Field index="1.7" label="Kota (tempat tanda tangan)" required><Input required {...c('city')} /></Field>
            <div />
            <Field index="1.8" label="Penandatangan" required><Input required value={company.signatory.name} onChange={(e) => setCompany({ ...company, signatory: { ...company.signatory, name: e.target.value } })} /></Field>
            <Field index="1.9" label="Jabatan" required><Input required value={company.signatory.title} onChange={(e) => setCompany({ ...company, signatory: { ...company.signatory, title: e.target.value } })} /></Field>
            <div className="sm:col-span-2"><Button type="submit" loading={busy === 'company'}>{t('company.saveProfile')}</Button></div>
          </form>
        </Card>
        <Card>
          <CardHeader index={2} title={t('company.secApp')} />
          <form className="grid gap-3 p-5" onSubmit={(e) => { e.preventDefault(); save('app', app); }}>
            <Field index="2.1" label="Nama Aplikasi" required><Input required {...a('name')} /></Field>
            <Field index="2.2" label="Subjudul"><Input {...a('subtitle')} /></Field>
            <Field index="2.3" label="Tagline (halaman login)"><Input {...a('tagline')} /></Field>
            <Field index="2.4" label="Deskripsi (halaman login)"><Textarea value={app.description} onChange={(e) => setApp({ ...app, description: e.target.value })} /></Field>
            <Field index="2.5" label="Label lingkungan (topbar)" hint="Kosongkan untuk menyembunyikan"><Input {...a('environmentLabel')} /></Field>
            <Field index="2.6" label="Kop dokumen cetak"><Input {...a('printHeader')} /></Field>
            <Field index="2.7" label="Catatan kaki cetak"><Input {...a('printFootnote')} /></Field>
            <div><Button type="submit" loading={busy === 'app'}>{t('company.saveApp')}</Button></div>
          </form>
        </Card>
      </div>
    </>
  );
}
