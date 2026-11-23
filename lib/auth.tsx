'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, token } from './api';
import type { User } from './types';

type Auth = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void };
const Ctx = createContext<Auth>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token.get()) { setLoading(false); return; }
    api<User>('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', json: { email, password } });
    token.set(r.token);
    setUser(r.user);
  }, []);
  const logout = useCallback(() => { token.clear(); setUser(null); location.href = '/login'; }, []);

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
export const canWrite = (u: User | null) => !!u?.canWrite;
export const isAdmin = (u: User | null) => !!u?.isAdmin;
