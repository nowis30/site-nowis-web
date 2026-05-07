'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { songRequestPortalInputSchema } from '@/lib/validators/song-request';

const songRequestFormSchema = songRequestPortalInputSchema;

type SongRequestFormValues = z.input<typeof songRequestFormSchema>;

type SongRequestSuccess = {
  message: string;
};

type SongRequestCreateResponse = {
  success?: boolean;
  id?: string;
  redirectTo?: string;
  error?: string;
  loginUrl?: string;
};

const styleOptions = ['Pop', 'Acoustique', 'Rap / Hip-hop', 'R&B', 'Rock', 'Country', 'Ballade', 'Autre'];
const moodOptions = ['Heureux', 'Triste', 'Motivant', 'Emotive', 'Festive', 'Inspirante', 'Douce', 'Energique', 'Sincere', 'Autre'];
const languageOptions = ['Francais', 'Anglais', 'Espagnol', 'Bilingue', 'Autre'];
const tempoOptions = [
  { value: 'LENT', label: 'Lent' },
  { value: 'MOYEN', label: 'Moyen' },
  { value: 'RAPIDE', label: 'Rapide' },
];

interface SongRequestFormProps {
  defaultFullName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

function inputClass() {
  return 'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500';
}

export function SongRequestForm({ defaultFullName, defaultEmail, defaultPhone }: SongRequestFormProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [successState, setSuccessState] = useState<SongRequestSuccess | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const defaultValues = useMemo<SongRequestFormValues>(
    () => ({
      fullName: defaultFullName ?? user?.name ?? '',
      email: defaultEmail ?? user?.email ?? '',
      phone: defaultPhone ?? '',
      title: '',
      language: 'Francais',
      songType: '',
      tempo: 'MOYEN',
      eventType: '',
      recipientName: '',
      specialMessage: '',
      style: '',
      mood: '',
      theme: '',
      description: '',
      inspirations: '',
      lyrics: '',
      structureVerse: '',
      structureChorus: '',
      structureBridge: '',
      fileUrl: '',
      budget: undefined,
      desiredDeadline: undefined,
      consentToBeContacted: false,
      source: 'website',
      antiSpam: '',
    }),
    [user?.email, user?.name, defaultFullName, defaultEmail, defaultPhone],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SongRequestFormValues>({
    resolver: zodResolver(songRequestFormSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccessState(null);
    setSubmitError(null);

    try {
      const payload: z.input<typeof songRequestPortalInputSchema> = {
        ...values,
        occasion: values.eventType,
        details: values.description,
      };

      const response = await fetch('/api/site/song-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as SongRequestCreateResponse | null;

      if (response.status === 401 && typeof data?.loginUrl === 'string') {
        window.location.href = data.loginUrl;
        return;
      }

      if (!response.ok) {
        setSubmitError(data?.error ?? 'Impossible d envoyer la demande. Merci de reessayer.');
        return;
      }

      const redirectTo = data?.redirectTo || (data?.id ? `/client/song-requests/${data.id}` : null);
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      setSuccessState({
        message: 'Merci. Votre demande a ete envoyee.',
      });
      setUploadedFileName(null);
      reset({ ...defaultValues, consentToBeContacted: false });
    } catch {
      setSubmitError('Connexion impossible au serveur. Verifiez votre reseau puis reessayez.');
    }
  }, (invalid: FieldErrors<SongRequestFormValues>) => {
    const firstKey = Object.keys(invalid)[0] as keyof SongRequestFormValues | undefined;
    const firstError = firstKey ? invalid[firstKey] : undefined;
    const message = firstError && typeof firstError === 'object' && 'message' in firstError && typeof firstError.message === 'string'
      ? firstError.message
      : 'Certains champs obligatoires sont incomplets.';

    setSubmitError(`Formulaire incomplet: ${message}`);
    if (firstKey) {
      setFocus(firstKey);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  async function handleFileUpload(file: File) {
    setSubmitError(null);
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/site/song-requests/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (response.status === 401 && typeof data?.loginUrl === 'string') {
        window.location.href = data.loginUrl;
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || 'Upload impossible');
      }
      setUploadedFileName(data.fileName || file.name);
      setValue('fileUrl', data.fileUrl ?? '', { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Upload impossible');
    } finally {
      setUploadingFile(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg md:p-8">
      <h3 className="text-2xl font-bold text-slate-900">Nouvelle demande</h3>
      <p className="mt-2 text-sm text-slate-600">Version simple: remplissez l essentiel, puis envoyez.</p>

      {successState ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p>{successState.message}</p>
        </div>
      ) : null}

      {submitError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Essentiel</h4>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="eventType">Titre ou occasion</label>
            <input id="eventType" {...register('eventType')} className={inputClass()} placeholder="Anniversaire, hommage, retraite..." />
            {errors.eventType ? <p className="mt-1 text-xs text-red-600">{errors.eventType.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="recipientName">Personne concernee</label>
            <input id="recipientName" {...register('recipientName')} className={inputClass()} placeholder="Nom ou prenom" />
            {errors.recipientName ? <p className="mt-1 text-xs text-red-600">{errors.recipientName.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="mood">Emotion</label>
              <select id="mood" {...register('mood')} className={inputClass()}>
                <option value="">Selectionner</option>
                {moodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {errors.mood ? <p className="mt-1 text-xs text-red-600">{errors.mood.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="style">Style musical</label>
              <select id="style" {...register('style')} className={inputClass()}>
                <option value="">Selectionner</option>
                {styleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {errors.style ? <p className="mt-1 text-xs text-red-600">{errors.style.message}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">Histoire / message</label>
            <textarea id="description" rows={5} {...register('description')} className={inputClass()} placeholder="Expliquez l histoire, les elements importants et le ton souhaite..." />
            {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="desiredDeadline">Date souhaitee (optionnel)</label>
              <input id="desiredDeadline" type="date" {...register('desiredDeadline')} className={inputClass()} />
              {errors.desiredDeadline ? <p className="mt-1 text-xs text-red-600">{errors.desiredDeadline.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="songRequestFile">Fichier (optionnel)</label>
              <input
                id="songRequestFile"
                type="file"
                accept=".pdf,.doc,.docx,text/plain"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await handleFileUpload(file);
                  }
                }}
                className={inputClass()}
              />
              <input type="hidden" {...register('fileUrl')} />
              {uploadingFile ? <p className="mt-2 text-xs text-slate-500">Upload en cours...</p> : null}
              {uploadedFileName ? <p className="mt-2 text-xs text-emerald-700">Fichier lie: {uploadedFileName}</p> : null}
            </div>
          </div>
        </section>

        <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Options avancees</summary>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">Titre interne</label>
                <input id="title" {...register('title')} className={inputClass()} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="songType">Type de chanson</label>
                <input id="songType" {...register('songType')} className={inputClass()} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="language">Langue</label>
                <select id="language" {...register('language')} className={inputClass()}>
                  {languageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="tempo">Tempo</label>
                <select id="tempo" {...register('tempo')} className={inputClass()}>
                  {tempoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="theme">Theme</label>
                <input id="theme" {...register('theme')} className={inputClass()} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="specialMessage">Message special</label>
              <input id="specialMessage" {...register('specialMessage')} className={inputClass()} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="inspirations">Inspirations</label>
              <textarea id="inspirations" rows={3} {...register('inspirations')} className={inputClass()} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lyrics">Paroles</label>
              <textarea id="lyrics" rows={5} {...register('lyrics')} className={inputClass()} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="structureVerse">Structure couplet</label>
                <textarea id="structureVerse" rows={3} {...register('structureVerse')} className={inputClass()} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="structureChorus">Structure refrain</label>
                <textarea id="structureChorus" rows={3} {...register('structureChorus')} className={inputClass()} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="structureBridge">Structure pont</label>
              <textarea id="structureBridge" rows={3} {...register('structureBridge')} className={inputClass()} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="budget">Budget (optionnel)</label>
              <input id="budget" type="number" min="0" step="1" {...register('budget')} className={inputClass()} />
            </div>
          </div>
        </details>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Coordonnees</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="fullName">Nom complet</label>
              <input id="fullName" {...register('fullName')} className={inputClass()} />
              {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">Courriel</label>
              <input id="email" type="email" {...register('email')} className={inputClass()} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">Telephone</label>
            <input id="phone" type="tel" {...register('phone')} className={inputClass()} />
            {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
          </div>
        </section>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-1 h-4 w-4" {...register('consentToBeContacted')} />
          <span>J accepte d etre recontacte(e) par Nowis pour le suivi de cette demande.</span>
        </label>

        <input type="hidden" {...register('source')} value="website" />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...register('antiSpam')} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
        </Button>
      </form>
    </div>
  );
}
