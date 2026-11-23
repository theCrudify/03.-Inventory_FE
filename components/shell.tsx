'use client';
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Settings, Ship, UserRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAdmin, useAuth } from '@/lib/auth';
import { useMeta, type Meta } from '@/lib/meta';
import { ThemeLangControls, usePrefs } from '@/lib/prefs';
import type { I18nKey } from '@/lib/i18n';
import { Badge, PageShellSkeleton, cx } from './ui';

type NavItem = { href: string; label: string };
type NavGroup = { label: string; icon: React.ElementType; items?: NavItem[]; href?: string; admin?: boolean };

const buildNav = (m: Meta, t: (k: I18nKey) => string): NavGroup[] => [
  { label: t('nav.dashboard'), icon: LayoutDashboard, href: '/' },
  { label: t('nav.sourceDocs'), icon: FileText, items: m.refs('jenis_sumber').map((r) => ({ href: `/sumber-dokumen/${r.code}`, label: r.name })) },
  ...m.refs('arah_dokumen').map((d, i) => ({
    label: d.name, icon: i ? ArrowUpFromLine : ArrowDownToLine,
    items: m.bcTypes.filter((b) => b.direction === d.code).map((b) => ({ href: `/dokumen/${b.slug}`, label: b.label })),
  })),
  { label: t('nav.reports'), icon: BarChart3, items: m.refs('kategori_barang').map((r) => ({ href: `/laporan/${(r.meta as { slug: string }).slug}`, label: r.name })) },
  { label: t('nav.master'), icon: Boxes, items: [{ href: '/master/barang', label: t('nav.items') }, { href: '/master/mitra', label: t('nav.partners') }, { href: '/master/referensi', label: t('nav.refs') }] },
  { label: t('nav.settings'), icon: Settings, admin: true, items: [{ href: '/pengaturan/perusahaan', label: t('nav.company') }, { href: '/pengaturan/pengguna', label: t('nav.users') }, { href: '/pengaturan/role', label: 'Role' }, { href: '/pengaturan/status', label: 'Status Dokumen' }, { href: '/pengaturan/audit-log', label: t('nav.auditLog') }] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const meta = useMeta();
  const { t } = usePrefs();
  const nav = buildNav(meta, t);
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [loading, user, router]);
  useEffect(() => { setOpen(false); setMenu(false); }, [path]);

  if (loading || !user) return <PageShellSkeleton label={t('common.preparingApp')} />;

  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

  return (
    <div className="flex min-h-dvh bg-slate-50/70 transition-colors dark:bg-slate-950 print:block print:bg-white">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 print:hidden',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8.5 place-items-center rounded-lg bg-teal-700 text-white shadow-xs dark:bg-teal-600">
              <Ship className="size-4.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{meta.app.name}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">{meta.app.subtitle}</span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label={t('common.closeMenu')}
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {nav.filter((g) => !g.admin || isAdmin(user)).map((g) => (
            <div key={g.label}>
              {g.href ? (
                <Link
                  href={g.href}
                  className={cx(
                    'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    active(g.href)
                      ? 'bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-teal-600'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                  )}
                >
                  <g.icon className="size-4 text-slate-500 dark:text-slate-400" />
                  <span>{g.label}</span>
                </Link>
              ) : (
                <>
                  <div className="mb-1 flex items-center gap-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <g.icon className="size-3.5 opacity-70" />
                    <span>{g.label}</span>
                  </div>
                  <div className="space-y-0.5">
                    {g.items!.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={cx(
                          'relative block rounded-lg py-1.5 pl-8 pr-2.5 text-sm transition-colors',
                          active(i.href)
                            ? 'bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-teal-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                        )}
                      >
                        {i.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3.5 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{meta.company.name}</span><br />
          NPWP {meta.company.npwp} · Izin KB {meta.company.izinKb}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 print:hidden">
          <button
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label={t('common.openMenu')}
          >
            <Menu className="size-5" />
          </button>
          {meta.app.environmentLabel && <Badge tone="amber">{meta.app.environmentLabel}</Badge>}
          <div className="ml-auto flex items-center gap-3">
            <ThemeLangControls />
            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-expanded={menu}
              >
                <span className="grid size-7.5 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300 ring-1 ring-teal-200/60 dark:ring-teal-800/60">
                  {user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">{meta.role(user.role).label}</span>
                </span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 z-40 mt-1 w-48 rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in duration-150">
                    <Link
                      href="/akun"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <UserRound className="size-4 text-slate-400" />
                      {t('nav.myAccount')}
                    </Link>
                    <button
                      onClick={() => { setMenu(false); logout(); }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="size-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
