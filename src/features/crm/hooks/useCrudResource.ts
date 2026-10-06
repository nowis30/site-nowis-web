'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export function useCrudResource<T>(endpoint: string, search: string) {
  return useCrudResourceWithParams<T>(endpoint, search);
}

export function useCrudResourceWithParams<T>(endpoint: string, search: string, queryParams?: Record<string, string | undefined>) {
  const [state, setState] = useState<CrudState<T> & { url: string | null }>({
    items: [],
    loading: true,
    error: null,
    url: null,
  });
  const generation = useRef(0);
  const mounted = useRef(false);
  const activeUrl = useRef<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value && value.trim().length > 0) {
          params.set(key, value);
        }
      });
    }
    return params.toString();
  }, [search, queryParams]);

  const url = `${endpoint}${query ? `?${query}` : ''}`;
  const load = useCallback(async () => {
    const request = ++generation.current;
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de chargement');
      }
      return { request, state: { url, items: data.items as T[], loading: false, error: null } };
    } catch (error) {
      return { request, state: { url, items: [] as T[], loading: false, error: error instanceof Error ? error.message : 'Erreur inconnue' } };
    }
  }, [url]);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    activeUrl.current = url;
    void load().then((result) => {
      if (active && result.request === generation.current) setState(result.state);
    });
    return () => { active = false; mounted.current = false; };
  }, [load, url]);

  const reload = useCallback(async () => {
    if (!mounted.current || activeUrl.current !== url) return;
    setState((previous) => ({ ...previous, url, loading: true, error: null }));
    const result = await load();
    if (mounted.current && activeUrl.current === url && result.request === generation.current) setState(result.state);
  }, [load, url]);

  const loading = state.url !== url || state.loading;
  return {
    items: state.url === url ? state.items : [],
    loading,
    error: loading ? null : state.error,
    reload,
  };
}

export async function createResource(endpoint: string, payload: unknown) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function updateResource(endpoint: string, id: string, payload: unknown) {
  const response = await fetch(`${endpoint}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function deleteResource(endpoint: string, id: string) {
  const response = await fetch(`${endpoint}/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Suppression impossible');
  }
  return data;
}

export async function patchResource(endpoint: string, id: string, payload: unknown) {
  const response = await fetch(`${endpoint}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Action impossible');
  }
  return data;
}
