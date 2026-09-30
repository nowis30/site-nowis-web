'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type RadioUser = { id: string; displayName: string };
export function useRadioFavorites() {
  const [user, setUser] = useState<RadioUser | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const request = ++version.current;
    try {
      const response = await fetch('/api/radio/favorites', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (request === version.current) { setUser(data.user); setIds(data.trackIds); setError(''); }
    } catch (err) {
      if (request === version.current) setError(err instanceof Error ? err.message : 'Impossible de charger les favoris.');
    } finally { if (request === version.current) setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const focus = () => { void refresh(); };
    const invalidate = () => { version.current++; };
    window.addEventListener('focus', focus);
    return () => { invalidate(); window.removeEventListener('focus', focus); };
  }, [refresh]);
  async function toggle(id: string) {
    if (!user || pending.current) return;
    pending.current = true;
    version.current++;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/radio/favorites', { method: ids.includes(id) ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: id }) });
      const data = await response.json();
      if (response.status === 401) { setUser(null); setIds([]); }
      if (!response.ok) throw new Error(data.message);
      setIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Le favori n’a pas pu être enregistré.'); return; }
    finally { pending.current = false; setBusy(false); }
  }
  async function logout() {
    if (pending.current) return false;
    pending.current = true; version.current++; setBusy(true); setError('');
    try {
      const response = await fetch('/api/client-auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('La déconnexion a échoué. Réessayez.');
      setUser(null); setIds([]);
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Déconnexion impossible.'); return false; }
    finally { pending.current = false; setBusy(false); }
  }
  return { user, ids, loading, busy, error, refresh, toggle, logout };
}
