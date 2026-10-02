'use client';

import { useId, useRef, useState } from 'react';
import { Copy, Share2, X } from 'lucide-react';

// Always share the public pages, including from a preview or a private portal.
const defaultDestinations = [
  { id: 'radio', label: 'la radio', title: 'Radio Nowis', url: 'https://nowis.store/radio', text: 'Écoute Radio Nowis : les chansons de Nowis en continu.' },
  { id: 'site', label: 'le site', title: 'Création Nowis', url: 'https://nowis.store', text: 'Découvre Création Nowis : des chansons, des créations et des histoires à partager.' },
] as const;

type Destination = { id: string; label: string; title: string; url: string; text: string };

type ShareMenuProps = {
  compact?: boolean;
  destinations?: readonly Destination[];
  triggerLabel?: string;
  triggerClassName?: string;
};

export function ShareMenu({ compact = false, destinations = defaultDestinations, triggerLabel, triggerClassName }: ShareMenuProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const links = useRef<Record<string, HTMLInputElement | null>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function share(destination: Destination, copyOnly = false) {
    if (busy) return;
    setBusy(true);
    setStatus('');
    try {
      if (!copyOnly && typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: destination.title, text: destination.text, url: destination.url });
          setStatus(`Merci de faire découvrir ${destination.label} !`);
          return;
        } catch (error) {
          // Cancelling the phone's share sheet must not copy anything unexpectedly.
          if (error instanceof Error && error.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(destination.url);
        setStatus(`Lien pour ${destination.label} copié ! Vous pouvez le coller dans votre message.`);
      } catch {
        links.current[destination.id]?.focus();
        links.current[destination.id]?.select();
        setStatus('La copie automatique est indisponible. Le lien est sélectionné : copiez-le manuellement.');
      }
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button type="button" className={triggerClassName ?? (compact ? 'nr-icon ns-trigger' : 'ns-trigger ns-trigger-label')}
      aria-label={triggerLabel ?? 'Partager la radio ou le site'} aria-haspopup="dialog" aria-controls={id}
      title={triggerLabel ?? 'Partager la radio ou le site'} onClick={() => { setStatus(''); dialog.current?.showModal(); }}>
      <Share2 size={19} aria-hidden="true" />{!compact && <span>{triggerLabel ?? 'Partager'}</span>}
    </button>
    <dialog ref={dialog} id={id} className="ns-dialog" aria-labelledby={`${id}-title`}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="ns-dialog-content">
        <div className="ns-dialog-heading">
          <h2 id={`${id}-title`}>Partager avec vos amis</h2>
          <button type="button" className="nr-icon" aria-label="Fermer le partage" onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
        </div>
        {destinations.map(destination => <section className="ns-destination" key={destination.id} aria-labelledby={`${id}-${destination.id}-label`}>
          <label id={`${id}-${destination.id}-label`} htmlFor={`${id}-${destination.id}`}>{destination.title}</label>
          <input ref={element => { links.current[destination.id] = element; }} id={`${id}-${destination.id}`} type="url" readOnly value={destination.url}
            aria-label={`Lien pour ${destination.label}`} onFocus={event => event.currentTarget.select()} />
          <div className="ns-actions">
            <button type="button" className="ns-share" disabled={busy} onClick={() => void share(destination)}><Share2 size={18} aria-hidden="true" />Partager {destination.label}</button>
            <button type="button" className="ns-copy" disabled={busy} aria-label={`Copier le lien pour ${destination.label}`} onClick={() => void share(destination, true)}><Copy size={17} aria-hidden="true" />Copier le lien</button>
          </div>
        </section>)}
        <p className="ns-status" role="status">{status}</p>
      </div>
    </dialog>
  </>;
}
