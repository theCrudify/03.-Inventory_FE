'use client';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { ErrorBox, PageShellSkeleton } from '@/components/ui';
import { usePrefs } from './prefs';
import { useFetch } from './use-fetch';

// Everything descriptive the UI shows (labels, options, BC rules, company/app profile) comes from
// GET /meta, i.e. from the master tables. Nothing here is hardcoded business data.
export type RefRow = { id: number; type: string; code: string; name: string; meta: Record<string, unknown> | null; sort: number };
export type Tone = 'gray' | 'blue' | 'amber' | 'violet' | 'green' | 'red' | 'teal';
/** Badge palette (styling only), shared by role and status masters. */
export const TONES: Tone[] = ['gray', 'blue', 'amber', 'violet', 'green', 'red', 'teal'];
/** Rows of the `roles` and `document_statuses` master tables. Behaviour is boolean columns. */
export type RoleRow = { code: string; name: string; description: string; tone: Tone; canWrite: boolean; isAdmin: boolean; sort: number };
export type StatusRow = {
  code: string; name: string; tone: Tone; initial: boolean; editable: boolean; inFlight: boolean;
  registered: boolean; approved: boolean; rejected: boolean; sort: number;
};
export type BcType = {
  code: string; label: string; title: string; direction: string; partnerKind: string; ceisaCode: string; slug: string;
  international: boolean; defaultOffice: string; approvalCode: string; approvalMessage: string;
  duty: string; sourceDoc: string; requiresGuarantee: boolean;
};
export type Company = { name: string; npwp: string; izinKb: string; companyId: string; address: string; city: string; timezone: string; signatory: { name: string; title: string } };
export type AppInfo = {
  name: string; subtitle: string; tagline: string; description: string; features: string[]; environmentLabel: string | null;
  footnote: string | null; printHeader: string; printFootnote: string | null;
  demo: { password: string; accounts: { email: string; label: string; description: string }[] } | null;
};
type MetaPayload = { company: Company; app: AppInfo; refs: Record<string, RefRow[]>; roles: RoleRow[]; statuses: StatusRow[] };

const statusOf = (r: StatusRow | undefined, code: string) => ({
  code, label: r?.name ?? code, tone: r?.tone ?? 'gray', initial: !!r?.initial, editable: !!r?.editable, inFlight: !!r?.inFlight,
  registered: !!r?.registered, approved: !!r?.approved, rejected: !!r?.rejected,
});
const roleOf = (r: RoleRow | undefined, code: string) => ({
  code, label: r?.name ?? code, description: r?.description ?? '', tone: r?.tone ?? 'gray', canWrite: !!r?.canWrite, isAdmin: !!r?.isAdmin,
});

function build(m: MetaPayload) {
  const refs = (type: string) => m.refs[type] ?? [];
  const find = (type: string, code?: string | null) => (code ? refs(type).find((r) => r.code === code) : undefined);
  // Optional flags are omitted in master data when false; normalise them here once.
  const bcTypes: BcType[] = refs('jenis_bc').map((r) => {
    const m = r.meta as Omit<BcType, 'code' | 'label'>;
    return { code: r.code, label: r.name, ...m, international: !!m.international, requiresGuarantee: !!m.requiresGuarantee };
  });
  return {
    ...m,
    refs,
    find,
    /** Display name for a reference code, falling back to the code itself. */
    label: (type: string, code?: string | null) => find(type, code)?.name ?? code ?? '-',
    metaOf: <T = Record<string, unknown>>(type: string, code?: string | null) => (find(type, code)?.meta ?? {}) as T,
    options: (type: string, withCode = true) => refs(type).map((r) => ({ value: r.code, label: withCode ? `${r.code} – ${r.name}` : r.name })),
    bcTypes,
    bc: (code: string) => bcTypes.find((b) => b.code === code),
    bcBySlug: (slug: string) => bcTypes.find((b) => b.slug === slug),
    status: (code: string) => statusOf(m.statuses.find((s) => s.code === code), code),
    /** Statuses in master order, with their lifecycle flags. */
    statuses: () => m.statuses.map((s) => statusOf(s, s.code)),
    statusOptions: () => m.statuses.map((s) => ({ value: s.code, label: s.name })),
    role: (code: string) => roleOf(m.roles.find((r) => r.code === code), code),
    roleOptions: () => m.roles.map((r) => ({ value: r.code, label: r.name })),
    direction: (code: string) => {
      const r = find('arah_dokumen', code);
      const m = (r?.meta ?? {}) as Partial<{ partyLabel: string; shortLabel: string; tone: Tone; countryField: string; countryLabel: string }>;
      return { code, label: r?.name ?? code, partyLabel: m.partyLabel ?? '', shortLabel: m.shortLabel ?? '', tone: m.tone ?? 'gray', countryField: m.countryField ?? '', countryLabel: m.countryLabel ?? '' };
    },
    duty: (code: string) => ({ label: find('perlakuan_pungutan', code)?.name ?? code, charged: !!(find('perlakuan_pungutan', code)?.meta as { charged?: boolean })?.charged }),
  };
}
export type Meta = ReturnType<typeof build> & { /** Re-read master data after an admin edits it. */ reload: () => void };

const Ctx = createContext<Meta | null>(null);

export function MetaProvider({ children }: { children: React.ReactNode }) {
  const { data, error, reload } = useFetch<MetaPayload>('/meta');
  const { t } = usePrefs();
  const meta = useMemo<Meta | null>(() => (data ? { ...build(data), reload: () => reload(true) } : null), [data, reload]);
  useEffect(() => { if (meta) document.title = meta.app.name; }, [meta]);
  if (error) return <div className="p-6"><ErrorBox text={error} /></div>;
  if (!meta) return <PageShellSkeleton label={t('common.loadingMaster')} />;
  return <Ctx.Provider value={meta}>{children}</Ctx.Provider>;
}

export const useMeta = () => {
  const m = useContext(Ctx);
  if (!m) throw new Error('useMeta must be used inside <MetaProvider>');
  return m;
};
