'use client';
import { useState } from 'react';
import { Button, Card, CardHeader, DL, ErrorBox, Field, Input, PageHeader, toast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AkunPage() {
  const { user } = useAuth();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return setError('Konfirmasi password tidak sama');
    setBusy(true); setError('');
    try {
      await api('/auth/change-password', { method: 'POST', json: { currentPassword: f.currentPassword, newPassword: f.newPassword } });
      toast('Password berhasil diubah');
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Akun Saya" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Profil" /><div className="p-5"><DL items={[['Nama', user?.name], ['Email', user?.email], ['Role', user?.role]]} /></div></Card>
        <Card>
          <CardHeader title="Ubah Password" />
          <form onSubmit={submit} className="space-y-3 p-5">
            {error && <ErrorBox text={error} />}
            <Field label="Password saat ini"><Input type="password" autoComplete="current-password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></Field>
            <Field label="Password baru" hint="Minimal 8 karakter"><Input type="password" autoComplete="new-password" required minLength={8} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></Field>
            <Field label="Ulangi password baru"><Input type="password" autoComplete="new-password" required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
            <Button type="submit" loading={busy}>Simpan Password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
