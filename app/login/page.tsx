'use client';
import { Ship } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, ErrorBox, Field, Input, Skeleton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import type { AppInfo } from '@/lib/meta';
import { ThemeLangControls, usePrefs } from '@/lib/prefs';
import { useFetch } from '@/lib/use-fetch';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { t } = usePrefs();
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
  if (!data) {
    return (
      <div className="grid min-h-dvh bg-slate-50 dark:bg-slate-950 lg:grid-cols-2">
        <div className="hidden bg-teal-800 p-10 lg:block dark:bg-teal-950"><Skeleton className="h-6 w-40 bg-white/20" /></div>
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4">
            <Skeleton className="h-7 w-28" /><Skeleton className="h-4 w-56" />
            <Skeleton className="h-9 w-full rounded-lg" /><Skeleton className="h-9 w-full rounded-lg" /><Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  const { app } = data;

  return (
    <div className="grid min-h-dvh bg-slate-50 transition-colors dark:bg-slate-950 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-teal-800 p-10 text-teal-50 dark:bg-teal-950 lg:flex">
        <div className="flex items-center gap-2 font-semibold"><Ship className="size-5" />{app.name}</div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight text-white">{app.tagline}</h1>
          <p className="mt-4 max-w-md text-sm text-teal-100/80">{app.description}</p>
          <ul className="mt-8 grid max-w-md grid-cols-2 gap-3 text-sm">
            {app.features.map((ft) => <li key={ft} className="rounded-lg bg-white/10 px-3 py-2">{ft}</li>)}
          </ul>
        </div>
        {app.footnote && <p className="text-xs text-teal-200/70">{app.footnote}</p>}
      </div>
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4"><ThemeLangControls /></div>
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('login.title')}</h2>
          {app.demo && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('login.demoHint')} <code className="rounded bg-slate-200/70 px-1.5 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-200">{app.demo.password}</code></p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <ErrorBox text={error} />}
            <Field label={t('login.email')}><Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label={t('login.password')}><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            <Button type="submit" loading={busy} className="w-full">{t('login.submit')}</Button>
          </form>
          {app.demo && (
            <div className="mt-6 space-y-2">
              {app.demo.accounts.map((d) => (
                <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(app.demo!.password); }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-teal-300 hover:bg-teal-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700 dark:hover:bg-teal-950/40">
                  <span><span className="font-medium text-slate-800 dark:text-slate-100">{d.label}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{d.description}</span></span>
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-400">{t('login.autoFill')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
