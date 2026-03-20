'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { legalConfig, legalLinks, privacyCollectionNotice } from '@/data/legal';

type ContactFormProps = {
  initialName?: string;
  initialEmail?: string;
  initialProjectType?: string;
  initialMessage?: string;
  showPortfolioConsent?: boolean;
};

export const ContactForm: React.FC<ContactFormProps> = ({
  initialName = '',
  initialEmail = '',
  initialProjectType = '',
  initialMessage = '',
  showPortfolioConsent = false,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const resolvedName = initialName || user?.name || '';
  const resolvedEmail = initialEmail || user?.email || '';

  return (
    <div className="bg-white rounded-3xl p-10 shadow-lg">
      {submitted ? (
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Merci !</h3>
          <p className="text-gray-600">
            Votre message a bien été pris en compte. Je vous contacte rapidement.
          </p>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setIsSending(true);

            const form = e.currentTarget as HTMLFormElement;
            const data = Object.fromEntries(new FormData(form).entries());

            try {
              const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });

              if (!res.ok) {
                const body = await res.json().catch(() => null);
                const message =
                  (body && (body.error || body.message)) ||
                  (await res.text()) ||
                  'Une erreur est survenue. Merci de réessayer.';
                throw new Error(message);
              }

              setSubmitted(true);
              form.reset();
            } catch (err) {
              console.error(err);
              setError(err instanceof Error ? err.message : 'Erreur lors de l’envoi.');
            } finally {
              setIsSending(false);
            }
          }}
          className="space-y-6"
        >
          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
              Nom
            </label>
            <input
              key={`name-${resolvedName}`}
              id="name"
              name="name"
              type="text"
              required
              defaultValue={resolvedName}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Courriel
            </label>
            <input
              key={`email-${resolvedEmail}`}
              id="email"
              name="email"
              type="email"
              required
              defaultValue={resolvedEmail}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="vous@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Votre numéro pour un retour d'appel"
            />
            <p className="mt-2 text-xs text-gray-500">
              Optionnel, mais utile si vous voulez que je vous rappelle.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="projectType">
              Type de projet
            </label>
            <select
              id="projectType"
              name="projectType"
              required
              defaultValue={initialProjectType}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sélectionnez</option>
              <option value="chanson">Chanson personnalisée</option>
              <option value="video">Vidéo créative</option>
              <option value="mixte">Mix musique + vidéo</option>
              <option value="autre">Autre projet créatif</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="message">
              Décris ton idée
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              defaultValue={initialMessage}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Quelques détails sur ton projet (inspiration, ton, ambiance, deadline...)."
            />
          </div>

          {showPortfolioConsent ? (
            <fieldset className="rounded-2xl border border-gray-200 bg-slate-50 px-5 py-4">
              <legend className="px-1 text-sm font-medium text-gray-700">Portfolio et diffusion</legend>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Certains projets peuvent être montrés comme exemples seulement avec ton accord.
              </p>
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="portfolioConsent"
                    value="accept"
                    className="mt-1 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>J’accepte que ma chanson, mon visuel, ma vidéo ou un extrait puisse être utilisé par Création Nowis à titre de portfolio.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="portfolioConsent"
                    value="refuse"
                    className="mt-1 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>Je refuse toute diffusion publique de mon projet.</span>
                </label>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                Ce choix est facultatif. Si tu préfères, il pourra aussi être confirmé plus tard par écrit.
              </p>
            </fieldset>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
            <p>{privacyCollectionNotice.text}</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              {privacyCollectionNotice.bullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Responsable : {legalConfig.responsiblePrivacyName} —{' '}
              <a href={`mailto:${legalConfig.privacyEmail}`} className="font-medium text-emerald-700 hover:underline">
                {legalConfig.privacyEmail}
              </a>{' '}
              —{' '}
              <a href={legalConfig.privacyPhoneHref} className="font-medium text-emerald-700 hover:underline">
                {legalConfig.privacyPhone}
              </a>
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              <Link href={legalLinks.legal} className="font-medium text-emerald-700 hover:underline">
                Consulter nos mentions légales
              </Link>
              {' '}—{' '}
              <Link href={legalLinks.privacy} className="font-medium text-emerald-700 hover:underline">
                Consulter notre politique de confidentialité
              </Link>
              {' '}et{' '}
              <Link href={legalLinks.terms} className="font-medium text-emerald-700 hover:underline">
                nos conditions de vente
              </Link>
              .
            </p>
          </div>

          <Button type="submit" disabled={isSending} className="w-full">
            {isSending ? 'Envoi en cours…' : 'Envoyer ma demande'}
          </Button>
        </form>
      )}
    </div>
  );
};
