'use client';
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Settings, Ship, UserRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAdmin, useAuth } from '@/lib/auth';
import { useMeta, type Meta } from '@/lib/meta';
import { Badge, Spinner, cx } from './ui';

type NavItem = { href: string; label: string };
type NavGroup = { label: string; icon: React.ElementType; items?: NavItem[]; href?: string; admin?: boolean };

/** Menu built from master data: BC types per direction, report per item category, source-doc kinds. */
const buildNav = (m: Meta): NavGroup[] => [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Sumber Dokumen', icon: FileText, items: m.refs('jenis_sumber').map((r) => ({ href: `/sumber-dokumen/${r.code}`, label: r.name })) },
  // One menu group per document direction in master data.
  ...m.refs('arah_dokumen').map((d, i) => ({
    label: d.name, icon: i ? ArrowUpFromLine : ArrowDownToLine,
    items: m.bcTypes.filter((b) => b.direction === d.code).map((b) => ({ href: `/dokumen/${b.slug}`, label: b.label })),
  })),
  { label: 'Laporan Mutasi', icon: BarChart3, items: m.refs('kategori_barang').map((r) => ({ href: `/laporan/${(r.meta as { slug: string }).slug}`, label: r.name })) },
  { label: 'Master Data', icon: Boxes, items: [{ href: '/master/barang', label: 'Barang' }, { href: '/master/mitra', label: 'Mitra Usaha' }, { href: '/master/referensi', label: 'Referensi & Tarif' }] },
  { label: 'Pengaturan', icon: Settings, admin: true, items: [{ href: '/pengaturan/perusahaan', label: 'Profil Perusahaan' }, { href: '/pengaturan/pengguna', label: 'Pengguna & Role' }, { href: '/pengaturan/audit-log', label: 'Audit Log' }] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const meta = useMeta();
  const nav = buildNav(meta);
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [loading, user, router]);
  useEffect(() => { setOpen(false); setMenu(false); }, [path]);

  if (loading || !user) return <Spinner label="Menyiapkan aplikasi…" />;

  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

  return (
    <div className="flex min-h-dvh bg-slate-50 print:block print:bg-white">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 print:hidden', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-700 text-white"><Ship className="size-4.5" /></span>
            <span className="leading-tight"><span className="block text-sm font-semibold text-slate-900">{meta.app.name}</span><span className="block text-[11px] text-slate-500">{meta.app.subtitle}</span></span>
          </Link>
          <button className="rounded p-1 text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="size-4" /></button>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {nav.filter((g) => !g.admin || isAdmin(user)).map((g) => (
            <div key={g.label}>
              {g.href ? (
                <Link href={g.href} className={cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium', active(g.href) ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-100')}>
                  <g.icon className="size-4" />{g.label}
                </Link>
              ) : (
                <>
                  <div className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><g.icon className="size-3.5" />{g.label}</div>
                  {g.items!.map((i) => (
                    <Link key={i.href} href={i.href} className={cx('block rounded-lg py-1.5 pl-8 pr-2.5 text-sm', active(i.href) ? 'bg-teal-50 font-medium text-teal-800' : 'text-slate-600 hover:bg-slate-100')}>{i.label}</Link>
                  ))}
                </>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 text-[11px] leading-relaxed text-slate-400">
          {meta.company.name}<br />NPWP {meta.company.npwp} · Izin KB {meta.company.izinKb}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur print:hidden">
          <button className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="size-5" /></button>
          {meta.app.environmentLabel && <Badge tone="amber">{meta.app.environmentLabel}</Badge>}
          <div className="relative ml-auto">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100" aria-expanded={menu}>
              <span className="grid size-7 place-items-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">{user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}</span>
              <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-medium text-slate-800">{user.name}</span><span className="block text-[11px] text-slate-500">{meta.label('role', user.role)}</span></span>
              <ChevronDown className="size-4 text-slate-400" />
            </button>
            {menu && (
              <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <Link href="/akun" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><UserRound className="size-4" />Akun Saya</Link>
                <button onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="size-4" />Keluar</button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
