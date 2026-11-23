'use client';
import { Ship } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, ErrorBox, Field, Input, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import type { AppInfo } from '@/lib/meta';
import { useFetch } from '@/lib/use-fetch';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { data, error: metaError } = useFetch<{ app: AppInfo }>('/meta/public');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace('/'); }, [user, router]);
  useEffect(() => { if (data) document.title = data.app.name; }, [data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); router.replace('/'); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  if (metaError) return <div className="p-6"><ErrorBox text={metaError} /></div>;
  if (!data) return <Spinner />;
  const { app } = data;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-teal-800 p-10 text-teal-50 lg:flex">
        <div className="flex items-center gap-2 font-semibold"><Ship className="size-5" />{app.name}</div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight text-white">{app.tagline}</h1>
          <p className="mt-4 max-w-md text-sm text-teal-100/80">{app.description}</p>
          <ul className="mt-8 grid max-w-md grid-cols-2 gap-3 text-sm">
            {app.features.map((t) => <li key={t} className="rounded-lg bg-white/10 px-3 py-2">{t}</li>)}
          </ul>
        </div>
        {app.footnote && <p className="text-xs text-teal-200/70">{app.footnote}</p>}
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-slate-900">Masuk</h2>
          {app.demo && <p className="mt-1 text-sm text-slate-500">Gunakan akun demo di bawah. Password: <code className="rounded bg-slate-100 px-1">{app.demo.password}</code></p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <ErrorBox text={error} />}
            <Field label="Email"><Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            <Button type="submit" loading={busy} className="w-full">Masuk</Button>
          </form>
          {app.demo && (
            <div className="mt-6 space-y-2">
              {app.demo.accounts.map((d) => (
                <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(app.demo!.password); }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-teal-300 hover:bg-teal-50/50">
                  <span><span className="font-medium text-slate-800">{d.label}</span><span className="block text-xs text-slate-500">{d.description}</span></span>
                  <span className="text-xs text-teal-700">Isi otomatis</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
