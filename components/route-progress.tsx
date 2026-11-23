'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cx } from './ui';

export function RouteProgress() {
  const path = usePathname();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href?.startsWith('/')) return;
      if (new URL(a.href).pathname === path) return;
      setBusy(true);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [path]);

  useEffect(() => { setBusy(false); }, [path]);

  useEffect(() => {
    if (!busy) return;
    const id = setTimeout(() => setBusy(false), 4000);
    return () => clearTimeout(id);
  }, [busy]);

  return <div className={cx('route-progress print:hidden', busy && 'is-busy')} aria-hidden="true" />;
}
