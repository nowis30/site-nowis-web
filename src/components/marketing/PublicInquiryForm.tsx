'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { legalConfig } from '@/data/legal';
import type { PublicProjectType } from '@/lib/public-inquiry-security';

type Props = { serviceType?: PublicProjectType; groupType?: string; initialMessage?: string; portalPath?: string };

export function PublicInquiryForm({ serviceType = 'autre', groupType, initialMessage = '', portalPath = '/client/dashboard' }: Props) {
  const id = useId();
  const busy = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const fieldClass = 'mt-2 block w-full min-w-0 rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)]';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const fields = new FormData(event.currentTarget);
    setState('sending'); setError('');
    try {
      const response = await fetch('/api/public-inquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.get('name'), email: fields.get('email'), serviceType: fields.get('serviceType'),
          message: fields.get('message'), website: fields.get('website'),
          privacyAcknowledged: fields.get('privacyAcknowledged') === 'on',
          ...(groupType ? { groupType } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || 'Envoi impossible. Réessayez ou contactez-nous directement.');
      setState('success');
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (cause) {
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Envoi impossible. Réessayez ou contactez-nous directement.');
    } finally { busy.current = false; }
  }

  if (state === 'success') return (
    <div ref={statusRef} tabIndex={-1} role="status" className="brand-card p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-[color:var(--site-heading)]">Votre demande est enregistrée.</h2>
      <p className="mt-3 leading-7 text-[color:var(--site-muted)]">Nowis pourra vous répondre au courriel indiqué. Cette première prise de contact ne crée ni compte ni commande payante.</p>
      <p className="mt-3 text-sm leading-6">Le portail pourra servir au suivi après le premier échange. Les coordonnées de cette demande ne sont pas encore vérifiées.</p>
      <Link href={`/connexion?next=${encodeURIComponent(portalPath)}`} className="cta-secondary mt-5 inline-flex min-h-11 px-5 py-3">J’ai déjà un compte client</Link>
    </div>
  );

  return (
    <form onSubmit={submit} className="brand-card min-w-0 p-5 sm:p-8" aria-labelledby={`${id}-title`} aria-busy={state === 'sending'}>
      <h2 id={`${id}-title`} className="text-2xl font-bold text-[color:var(--site-heading)]">Parlez-moi de votre projet</h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Une première demande, sans compte et sans paiement. Les quatre champs ci-dessous sont requis.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="min-w-0 text-sm font-semibold" htmlFor={`${id}-name`}>Votre nom
          <input className={fieldClass} id={`${id}-name`} name="name" autoComplete="name" required minLength={2} maxLength={80} disabled={state === 'sending'} />
        </label>
        <label className="min-w-0 text-sm font-semibold" htmlFor={`${id}-email`}>Votre courriel
          <input className={fieldClass} id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} disabled={state === 'sending'} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold" htmlFor={`${id}-service`}>Type de projet
        <select className={fieldClass} id={`${id}-service`} name="serviceType" defaultValue={serviceType} required disabled={state === 'sending'}>
          <option value="chanson">Chanson personnalisée</option><option value="atelier">Atelier de groupe</option>
          <option value="video">Vidéo ou création visuelle</option><option value="autre">Autre projet / question</option>
        </select>
      </label>
      <label className="mt-4 block text-sm font-semibold" htmlFor={`${id}-message`}>Votre message
        <textarea className={fieldClass} id={`${id}-message`} name="message" rows={5} required minLength={10} maxLength={3000} defaultValue={initialMessage.slice(0, 3000)} aria-describedby={`${id}-hint`} disabled={state === 'sending'} />
      </label>
      <p id={`${id}-hint`} className="mt-2 text-sm text-[color:var(--site-muted)]">Quelques phrases suffisent. Pour un atelier : groupe, participants approximatifs et date souhaitée. Évitez les renseignements sensibles.</p>
      <div className="hidden" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label></div>
      <div className="mt-5 flex items-start gap-3 text-sm leading-6">
        <input id={`${id}-privacy`} name="privacyAcknowledged" type="checkbox" required className="mt-1 h-5 w-5 shrink-0" disabled={state === 'sending'} />
        <label htmlFor={`${id}-privacy`}>J’ai lu la <Link className="underline" href="/confidentialite">politique de confidentialité</Link>. Mes coordonnées servent à répondre à cette demande, sans inscription marketing ni autorisation de diffusion.</label>
      </div>
      {state === 'error' ? <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      <button type="submit" disabled={state === 'sending'} className="cta-primary mt-5 flex min-h-12 w-full items-center justify-center px-5 py-3 disabled:cursor-wait disabled:opacity-60">{state === 'sending' ? 'Envoi en cours…' : 'Envoyer ma demande sans compte'}</button>
      <p className="mt-4 break-words text-sm leading-6 text-[color:var(--site-muted)]">Contact direct : <a className="underline" href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a> ou <a className="underline" href={legalConfig.contactPhoneHref}>{legalConfig.contactPhone}</a>.</p>
    </form>
  );
}
