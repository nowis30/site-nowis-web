'use client';

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<User | null> {
  const response = await fetch('/api/auth/me', { cache: 'no-store' });
  if (!response.ok) return null;
  const data = (await response.json()) as { user: User | null };
  return data.user ?? null;
}

type AuthSnapshot = Pick<AuthContextValue, 'user' | 'loading' | 'error'>;
const initialSnapshot: AuthSnapshot = { user: null, loading: true, error: undefined };

function createAuthStore() {
  let snapshot = initialSnapshot;
  let requestVersion = 0;
  let started = false;
  const listeners = new Set<() => void>();
  const update = (next: Partial<AuthSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener();
  };
  const refresh = async () => {
    const version = ++requestVersion;
    update({ loading: true, error: undefined });
    try {
      const currentUser = await fetchMe();
      if (version === requestVersion) update({ user: currentUser, loading: false });
    } catch {
      if (version === requestVersion) update({ error: 'Impossible de vérifier l’authentification.', user: null, loading: false });
    }
  };
  const authenticate = async (path: string, body: Record<string, string>, fallback: string) => {
    const version = ++requestVersion;
    update({ loading: true, error: undefined });
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || fallback);
      }
      if (version === requestVersion) await refresh();
    } catch (error) {
      if (version === requestVersion) update({ error: error instanceof Error ? error.message : fallback, loading: false });
      throw error;
    }
  };
  const logout = async () => {
    const version = ++requestVersion;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      if (version === requestVersion) update({ user: null, loading: false, error: undefined });
    }
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (!started) { started = true; void refresh(); }
      return () => { listeners.delete(listener); };
    },
    refresh,
    login: (email: string, password: string) => authenticate('/api/auth/login', { email, password }, 'Identifiants invalides.'),
    register: (name: string, email: string, password: string) => authenticate('/api/auth/register', { name, email, password }, 'Échec de l’inscription.'),
    logout,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createAuthStore);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const value = useMemo(
    () => ({ ...snapshot, refresh: store.refresh, login: store.login, register: store.register, logout: store.logout }),
    [snapshot, store]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
