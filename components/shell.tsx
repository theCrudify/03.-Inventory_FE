'use client';
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, ChevronDown, ChevronRight, FileText, LayoutDashboard, LogOut,
  Menu, PanelLeft, Settings, Ship, UserRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAdmin, useAuth } from '@/lib/auth';
import { useMeta, type Meta } from '@/lib/meta';
import { ThemeLangControls, usePrefs } from '@/lib/prefs';
import type { I18nKey } from '@/lib/i18n';
import { PageShellSkeleton, cx } from './ui';

type NavItem = { href: string; label: string };
type NavGroup = { id: string; label: string; icon: React.ElementType; items?: NavItem[]; href?: string; admin?: boolean };

const buildNav = (m: Meta, t: (k: I18nKey) => string): NavGroup[] => [
  { id: 'dash', label: t('nav.dashboard'), icon: LayoutDashboard, href: '/' },
  { id: 'src', label: t('nav.sourceDocs'), icon: FileText, items: m.refs('jenis_sumber').map((r) => ({ href: `/sumber-dokumen/${r.code}`, label: r.name })) },
  ...m.refs('arah_dokumen').map((d, i) => ({
    id: `dir-${d.code}`, label: d.name, icon: i ? ArrowUpFromLine : ArrowDownToLine,
    items: m.bcTypes.filter((b) => b.direction === d.code).map((b) => ({ href: `/dokumen/${b.slug}`, label: b.label })),
  })),
  { id: 'rep', label: t('nav.reports'), icon: BarChart3, items: m.refs('kategori_barang').map((r) => ({ href: `/laporan/${(r.meta as { slug: string }).slug}`, label: r.name })) },
  { id: 'mst', label: t('nav.master'), icon: Boxes, items: [{ href: '/master/barang', label: t('nav.items') }, { href: '/master/mitra', label: t('nav.partners') }, { href: '/master/referensi', label: t('nav.refs') }] },
  { id: 'set', label: t('nav.settings'), icon: Settings, admin: true, items: [{ href: '/pengaturan/perusahaan', label: t('nav.company') }, { href: '/pengaturan/pengguna', label: t('nav.users') }, { href: '/pengaturan/role', label: 'Role' }, { href: '/pengaturan/status', label: 'Status Dokumen' }, { href: '/pengaturan/audit-log', label: t('nav.auditLog') }] },
];

const OPEN_KEY = 'arunika_nav_open';
const COLLAPSE_KEY = 'arunika_nav_collapsed';

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const meta = useMeta();
  const { t } = usePrefs();
  const router = useRouter();
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setOpenGroups(JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}'));
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}
  }, []);
  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [loading, user, router]);
  useEffect(() => { setDrawer(false); setMenu(false); }, [path]);

  if (loading || !user) return <PageShellSkeleton label={t('common.preparingApp')} />;

  const nav = buildNav(meta, t).filter((g) => !g.admin || isAdmin(user));
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));
  const activeGroup = nav.find((g) => (g.href ? active(g.href) : g.items?.some((i) => active(i.href))));
  const activeItem = activeGroup?.items?.find((i) => active(i.href));
  // A group is open if the user opened it, or (by default) when it holds the current page.
  const isOpen = (g: NavGroup) => openGroups[g.id] ?? g.id === activeGroup?.id;
  const toggle = (g: NavGroup) => setOpenGroups((s) => {
    const next = { ...s, [g.id]: !isOpen(g) };
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  const toggleCollapsed = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch {} return !c; });
  const mini = collapsed && !drawer;
  const initials = user.name.split(' ').map((s) => s[0]).slice(0, 2).join('');

  const itemCls = (on: boolean) => cx(
    'flex h-8 items-center gap-2.5 rounded-lg text-[13px] transition-colors',
    on
      ? 'bg-white font-medium text-slate-900 shadow-card ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700/60'
      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
  );

  return (
    <div className="flex min-h-dvh print:block">
      {drawer && <div className="anim-fade fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden" onClick={() => setDrawer(false)} />}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-100 transition-[width,transform] duration-200 dark:bg-[#08090c] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 print:hidden',
          mini ? 'lg:w-[68px]' : 'w-64 lg:w-60',
          drawer ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        )}
      >
        <div className={cx('flex h-14 shrink-0 items-center', mini ? 'justify-center' : 'justify-between px-4')}>
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-teal-500 to-teal-700 text-white shadow-btn ring-1 ring-inset ring-white/15">
              <Ship className="size-4" />
            </span>
            {!mini && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{meta.app.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{meta.app.subtitle}</span>
              </span>
            )}
          </Link>
          <button className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/60 lg:hidden" onClick={() => setDrawer(false)} aria-label={t('common.closeMenu')}>
            <X className="size-4" />
          </button>
        </div>

        <nav className={cx('flex-1 overflow-y-auto pb-4 pt-1 scrollbar-none', mini ? 'px-3' : 'px-3')}>
          <ul className="space-y-0.5">
            {nav.map((g) => {
              const groupActive = activeGroup?.id === g.id;
              if (mini) {
                const href = g.href ?? g.items?.[0]?.href ?? '/';
                return (
                  <li key={g.id}>
                    <Link href={href} title={g.label} className={cx(itemCls(groupActive), 'justify-center')}>
                      <g.icon className="size-4 shrink-0" />
                    </Link>
                  </li>
                );
              }
              if (g.href) {
                return (
                  <li key={g.id}>
                    <Link href={g.href} className={cx(itemCls(active(g.href)), 'px-2.5')}>
                      <g.icon className={cx('size-4 shrink-0', active(g.href) ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400')} />
                      {g.label}
                    </Link>
                  </li>
                );
              }
              const open = isOpen(g);
              return (
                <li key={g.id} className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => toggle(g)}
                    aria-expanded={open}
                    className={cx(
                      'flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/60',
                      groupActive ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                    )}
                  >
                    <g.icon className={cx('size-4 shrink-0', groupActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400')} />
                    <span className="flex-1 truncate text-left">{g.label}</span>
                    <ChevronRight className={cx('size-3.5 shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-90')} />
                  </button>
                  <div className={cx('grid transition-[grid-template-rows] duration-200', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                    <ul className="ml-[18px] space-y-0.5 overflow-hidden border-l border-slate-200 pl-2.5 dark:border-slate-800">
                      {g.items!.map((i, idx) => (
                        <li key={i.href} className={cx(idx === 0 && 'mt-0.5', idx === g.items!.length - 1 && 'mb-1')}>
                          <Link href={i.href} className={cx(itemCls(active(i.href)), 'px-2.5')}>
                            <span className="truncate">{i.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {!mini && (
          <div className="m-3 mt-0 rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{meta.company.name}</p>
            <p className="mt-0.5 truncate text-[11px] tabular-nums text-slate-500">NPWP {meta.company.npwp}</p>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2 print:p-0">
        <div className="flex flex-1 flex-col bg-white lg:rounded-xl lg:border lg:border-slate-200/80 lg:shadow-card dark:bg-slate-950 dark:lg:border-slate-800/80 print:border-0 print:shadow-none">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md lg:rounded-t-xl lg:px-6 dark:border-slate-800/80 dark:bg-slate-950/85 print:hidden">
            <button className="-ml-1 grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={() => setDrawer(true)} aria-label={t('common.openMenu')}>
              <Menu className="size-[18px]" />
            </button>
            <button
              className="-ml-2 hidden size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:grid dark:hover:bg-slate-800 dark:hover:text-slate-200"
              onClick={toggleCollapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="size-[18px]" />
            </button>
            <span className="mx-1 hidden h-4 w-px bg-slate-200 lg:block dark:bg-slate-800" />

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
              {activeGroup && activeItem ? (
                <>
                  <span className="hidden truncate text-slate-500 sm:inline">{activeGroup.label}</span>
                  <ChevronRight className="hidden size-3.5 shrink-0 text-slate-300 sm:block dark:text-slate-600" />
                  <Link href={activeItem.href} className="truncate font-medium text-slate-900 dark:text-slate-100">{activeItem.label}</Link>
                </>
              ) : (
                <span className="truncate font-medium text-slate-900 dark:text-slate-100">{activeGroup?.label ?? meta.app.name}</span>
              )}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {meta.app.environmentLabel && (
                <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 md:inline-flex dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <span className="size-1.5 rounded-full bg-amber-500" />{meta.app.environmentLabel}
                </span>
              )}
              <ThemeLangControls />
              <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="relative">
                <button
                  onClick={() => setMenu((m) => !m)}
                  aria-expanded={menu}
                  className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-to-b from-slate-700 to-slate-900 text-[11px] font-semibold text-white dark:from-slate-200 dark:to-slate-400 dark:text-slate-900">{initials}</span>
                  <span className="hidden text-left leading-tight md:block">
                    <span className="block text-[13px] font-medium text-slate-800 dark:text-slate-100">{user.name}</span>
                    <span className="block text-[11px] text-slate-500">{meta.role(user.role).label}</span>
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400" />
                </button>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                    <div className="anim-pop absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-pop dark:border-slate-800 dark:bg-slate-900">
                      <div className="px-2.5 py-2">
                        <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                      <Link href="/akun" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                        <UserRound className="size-4 text-slate-400" />{t('nav.myAccount')}
                      </Link>
                      <button onClick={() => { setMenu(false); logout(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                        <LogOut className="size-4" />{t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
          <main className="page-enter mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0" key={path}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
