'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface CrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export function useCrudResource<T>(endpoint: string, search: string) {
  const [state, setState] = useState<CrudState<T>>({
    items: [],
    loading: true,
    error: null,
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    return params.toString();
  }, [search]);

  const load = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      const response = await fetch(`${endpoint}${query ? `?${query}` : ''}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de chargement');
      }
      setState({ items: data.items as T[], loading: false, error: null });
    } catch (error) {
      setState({ items: [], loading: false, error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  }, [endpoint, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}

export function useCrudResourceWithParams<T>(endpoint: string, search: string, queryParams?: Record<string, string | undefined>) {
  const [state, setState] = useState<CrudState<T>>({
    items: [],
    loading: true,
    error: null,
  });

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

  const load = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      const response = await fetch(`${endpoint}${query ? `?${query}` : ''}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de chargement');
      }
      setState({ items: data.items as T[], loading: false, error: null });
    } catch (error) {
      setState({ items: [], loading: false, error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  }, [endpoint, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    reload: load,
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
