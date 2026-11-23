'use client';
import { ArrowRight, CheckCircle2, Ship } from 'lucide-react';
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
      <div className="grid min-h-dvh bg-white lg:grid-cols-[1.1fr_1fr] dark:bg-slate-950">
        <div className="hidden bg-slate-900 lg:block" />
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4"><Skeleton className="h-7 w-28" /><Skeleton className="h-4 w-56" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div>
        </div>
      </div>
    );
  }
  const { app } = data;

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1.1fr_1fr] dark:bg-slate-950">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_40%,black_20%,transparent_75%)]" />
        <div className="pointer-events-none absolute -left-32 -top-32 size-[520px] rounded-full bg-teal-500/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 size-[420px] rounded-full bg-teal-700/20 blur-[120px]" />

        <div className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-b from-teal-400 to-teal-600 ring-1 ring-inset ring-white/20"><Ship className="size-[18px]" /></span>
          <span className="text-sm font-semibold">{app.name}</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.025em]">{app.tagline}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">{app.description}</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
            {app.features.map((ft) => (
              <li key={ft} className="flex items-center gap-2 text-[13px] text-slate-300">
                <CheckCircle2 className="size-4 shrink-0 text-teal-400" />{ft}
              </li>
            ))}
          </ul>
        </div>

        {app.footnote ? <p className="relative text-xs text-slate-500">{app.footnote}</p> : <span />}
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center px-6 py-16">
        <div className="absolute right-5 top-5"><ThemeLangControls /></div>
        <div className="w-full max-w-[360px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-b from-teal-500 to-teal-700 text-white"><Ship className="size-[18px]" /></span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{app.name}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-50">{t('login.title')}</h2>
          {app.demo && (
            <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
              {t('login.demoHint')} <code className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">{app.demo.password}</code>
            </p>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            {error && <ErrorBox text={error} />}
            <Field label={t('login.email')}><Input type="email" autoComplete="username" placeholder="nama@perusahaan.co.id" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label={t('login.password')}><Input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            <Button type="submit" size="lg" loading={busy} className="w-full">{t('login.submit')}</Button>
          </form>

          {app.demo && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />Demo<span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="space-y-2">
                {app.demo.accounts.map((d) => {
                  const selected = email === d.email;
                  return (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => { setEmail(d.email); setPassword(app.demo!.password); }}
                      className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${selected ? 'border-teal-500 bg-teal-50/60 ring-4 ring-teal-500/10 dark:border-teal-500 dark:bg-teal-950/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900'}`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{d.label.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-slate-900 dark:text-slate-100">{d.label}</span>
                        <span className="block truncate text-xs text-slate-500">{d.description}</span>
                      </span>
                      <ArrowRight className={`size-4 shrink-0 transition-all ${selected ? 'text-teal-600' : 'text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
