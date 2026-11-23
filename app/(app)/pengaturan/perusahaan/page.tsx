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
          <CardHeader title={t('company.secTpb')} />
          <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save('company', company); }}>
            <Field label={t('company.fieldName')} required className="sm:col-span-2"><Input required {...c('name')} /></Field>
            <Field label={t('company.npwp')} required><Input required {...c('npwp')} /></Field>
            <Field label={t('company.izinKb')} required><Input required {...c('izinKb')} /></Field>
            <Field label={t('company.companyId')} required hint={t('company.companyIdHint')}><Input required {...c('companyId')} /></Field>
            <Field label={t('company.timezone')} required hint={t('company.timezoneHint')}><Input required {...c('timezone')} /></Field>
            <Field label={t('company.address')} required className="sm:col-span-2"><Input required {...c('address')} /></Field>
            <Field label={t('company.city')} required><Input required {...c('city')} /></Field>
            <div />
            <Field label={t('company.signatoryName')} required><Input required value={company.signatory.name} onChange={(e) => setCompany({ ...company, signatory: { ...company.signatory, name: e.target.value } })} /></Field>
            <Field label={t('company.signatoryTitle')} required><Input required value={company.signatory.title} onChange={(e) => setCompany({ ...company, signatory: { ...company.signatory, title: e.target.value } })} /></Field>
            <div className="sm:col-span-2"><Button type="submit" loading={busy === 'company'}>{t('company.saveProfile')}</Button></div>
          </form>
        </Card>
        <Card>
          <CardHeader title={t('company.secApp')} />
          <form className="grid gap-3 p-5" onSubmit={(e) => { e.preventDefault(); save('app', app); }}>
            <Field label={t('company.appName')} required><Input required {...a('name')} /></Field>
            <Field label={t('company.subtitle')}><Input {...a('subtitle')} /></Field>
            <Field label={t('company.tagline')}><Input {...a('tagline')} /></Field>
            <Field label={t('company.description')}><Textarea value={app.description} onChange={(e) => setApp({ ...app, description: e.target.value })} /></Field>
            <Field label={t('company.environmentLabel')} hint={t('company.environmentHint')}><Input {...a('environmentLabel')} /></Field>
            <Field label={t('company.printHeader')}><Input {...a('printHeader')} /></Field>
            <Field label={t('company.printFootnote')}><Input {...a('printFootnote')} /></Field>
            <div><Button type="submit" loading={busy === 'app'}>{t('company.saveApp')}</Button></div>
          </form>
        </Card>
      </div>
    </>
  );
}
