import { translate, type I18nKey } from './i18n';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const TOKEN_KEY = 'nis_token';
const lang = () => { try { return localStorage.getItem('arunika_lang') === 'en' ? 'en' : 'id'; } catch { return 'id'; } };
const apiMsg = (key: I18nKey, vars?: Record<string, string | number>) => translate(lang(), key, vars);

export const token = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch {} },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch {} },
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: { path: string; message: string }[]) { super(message); }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const t = token.get();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      ...rest,
      headers: { ...(json !== undefined && { 'content-type': 'application/json' }), ...(t && { authorization: `Bearer ${t}` }), ...rest.headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(apiMsg('error.apiUnreachable'), 0);
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    token.clear();
    if (typeof window !== 'undefined' && !location.pathname.startsWith('/login')) location.href = '/login';
  }
  if (!res.ok) throw new ApiError(body.message ?? apiMsg('error.httpStatus', { status: res.status }), res.status, body.errors);
  return body as T;
}

export type Paged<T> = { data: T[]; total: number; page: number; pageSize: number };
export const qs = (o: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};
