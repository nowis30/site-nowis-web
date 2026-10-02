'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

type Profile = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  _count?: { shares: number };
};

export function AiArtistProfileEditor() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetch('/api/ai-music/me', { cache: 'no-store' })
      .then(async (response) => response.json())
      .then((data: { authenticated: boolean; user?: { fullName: string }; profile?: Profile | null }) => {
        setAuthenticated(data.authenticated);
        if (data.profile) {
          setProfile(data.profile);
          setDisplayName(data.profile.displayName);
          setBio(data.profile.bio || '');
          setAvatarUrl(data.profile.avatarUrl);
          setBannerUrl(data.profile.bannerUrl);
        } else {
          setDisplayName(data.user?.fullName || '');
        }
      })
      .catch(() => setAuthenticated(false));
  }, []);

  async function uploadImage(purpose: 'avatar' | 'banner', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(purpose);
    setMessage('');
    try {
      const presign = await fetch('/api/ai-music/upload-image/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size, purpose }),
      });
      const data = await presign.json() as { uploadUrl?: string; file?: { url: string }; message?: string };
      if (!presign.ok || !data.uploadUrl || !data.file?.url) throw new Error(data.message || 'Envoi impossible.');
      const upload = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error('Le téléversement de l’image a échoué.');
      if (purpose === 'avatar') setAvatarUrl(data.file.url);
      else setBannerUrl(data.file.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/ai-music/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio: bio.trim() || null, avatarUrl, bannerUrl }),
      });
      const data = await response.json() as { profile?: Profile; message?: string };
      if (!response.ok || !data.profile) throw new Error(data.message || 'Impossible d’enregistrer le profil.');
      setProfile(data.profile);
      setMessage('Profil enregistré.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer le profil.');
    } finally {
      setBusy(false);
    }
  }

  if (authenticated === null) return <section className="nm-section"><p>Chargement du profil…</p></section>;
  if (!authenticated) {
    return (
      <section className="nm-section mx-auto max-w-2xl text-center">
        <p className="nm-eyebrow">Profil artiste</p>
        <h1 className="nm-page-title">Votre espace musical.</h1>
        <p className="nm-intro">Connectez-vous pour créer votre page d’artiste, ajouter vos images et regrouper vos chansons.</p>
        <div className="nm-actions justify-center">
          <Link className="cta-primary" href="/communaute-ia/compte">Créer mon compte ↗</Link>
          <Link className="cta-secondary" href="/connexion?next=/communaute-ia/profil">Me connecter</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="nm-section mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="nm-eyebrow">Mon profil artiste</p>
          <h1 className="nm-page-title">Présentez votre univers.</h1>
        </div>
        {profile?.slug ? <Link className="cta-secondary" href={`/communaute-ia/artiste/${profile.slug}`}>Voir ma page publique ↗</Link> : null}
      </div>

      <form onSubmit={save} className="brand-card mt-7 rounded-[2rem] p-5 sm:p-8">
        <div className="relative min-h-40 overflow-hidden rounded-[1.5rem] bg-[color:var(--site-soft)]">
          {bannerUrl ? <Image src={bannerUrl} alt="" fill sizes="(max-width: 900px) 100vw, 900px" className="object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <label className="absolute bottom-4 right-4 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow">
            {uploading === 'banner' ? 'Envoi…' : 'Changer la bannière'}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage('banner', event)} />
          </label>
        </div>

        <div className="-mt-10 ml-5 flex items-end gap-4">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[color:var(--site-soft)] shadow">
            {avatarUrl ? <Image src={avatarUrl} alt="Photo du profil artiste" fill sizes="112px" className="object-cover" /> : null}
          </div>
          <label className="mb-2 cursor-pointer rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-2 text-sm font-semibold">
            {uploading === 'avatar' ? 'Envoi…' : 'Photo de profil'}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage('avatar', event)} />
          </label>
        </div>

        <label className="mt-7 block text-sm font-medium text-[color:var(--site-heading)]">
          Nom d’artiste
          <input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
          Biographie
          <textarea maxLength={600} value={bio} onChange={(event) => setBio(event.target.value)}
            placeholder="Votre style, vos influences, ce que vous aimez créer avec l’IA…"
            className="mt-1.5 min-h-32 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3" />
        </label>
        {message ? <p className="mt-4 text-sm text-[color:var(--site-accent-strong)]">{message}</p> : null}
        <button className="cta-primary mt-5" disabled={busy || Boolean(uploading)}>{busy ? 'Enregistrement…' : 'Enregistrer mon profil'}</button>
      </form>
    </section>
  );
}
