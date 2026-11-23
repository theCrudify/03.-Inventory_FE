'use client';
import { useState } from 'react';
import { Button, Card, CardHeader, DL, ErrorBox, Field, Input, PageHeader, toast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';

export default function AkunPage() {
  const { user } = useAuth();
  const { t } = usePrefs();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return setError(t('account.pwMismatch'));
    setBusy(true); setError('');
    try {
      await api('/auth/change-password', { method: 'POST', json: { currentPassword: f.currentPassword, newPassword: f.newPassword } });
      toast(t('account.pwSaved'));
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title={t('account.title')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title={t('account.secProfile')} /><div className="p-5"><DL items={[[t('users.name'), user?.name], [t('users.email'), user?.email], [t('users.role'), user?.role]]} /></div></Card>
        <Card>
          <CardHeader title={t('account.secPassword')} />
          <form onSubmit={submit} className="space-y-3 p-5">
            {error && <ErrorBox text={error} />}
            <Field label={t('account.currentPw')}><Input type="password" autoComplete="current-password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></Field>
            <Field label={t('account.newPw')} hint={t('users.passwordHint')}><Input type="password" autoComplete="new-password" required minLength={8} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></Field>
            <Field label={t('account.confirmPw')}><Input type="password" autoComplete="new-password" required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
            <Button type="submit" loading={busy}>{t('account.savePw')}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
