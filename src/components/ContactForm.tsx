'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';

export const ContactForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Courriel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="vous@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="projectType">
              Type de projet
            </label>
            <select
              id="projectType"
              name="projectType"
              required
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Quelques détails sur ton projet (inspiration, ton, ambiance, deadline...)."
            />
          </div>

          <Button type="submit" disabled={isSending} className="w-full">
            {isSending ? 'Envoi en cours…' : 'Envoyer ma demande'}
          </Button>
        </form>
      )}
    </div>
  );
};
