'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { songRequestPortalInputSchema } from '@/lib/validators/song-request';

const songRequestFormSchema = songRequestPortalInputSchema;

type SongRequestFormValues = z.input<typeof songRequestFormSchema>;

type SongRequestSuccess = {
  message: string;
};

const songTypeOptions = [
  'Chanson anniversaire',
  'Chanson mariage',
  'Chanson hommage',
  'Chanson amour',
  'Chanson corporative',
  'Autre',
];

const styleOptions = [
  'Pop',
  'Acoustique',
  'Rap / Hip-hop',
  'R&B',
  'Rock',
  'Country',
  'Ballade',
  'Autre',
];

const moodOptions = [
  'Heureux',
  'Triste',
  'Motivant',
  'Émotive',
  'Festive',
  'Inspirante',
  'Douce',
  'Énergique',
  'Sincère',
  'Autre',
];

const languageOptions = ['Français', 'Anglais', 'Espagnol', 'Bilingue', 'Autre'];
const tempoOptions = [
  { value: 'LENT', label: 'Lent' },
  { value: 'MOYEN', label: 'Moyen' },
  { value: 'RAPIDE', label: 'Rapide' },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</h4>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

interface SongRequestFormProps {
  defaultFullName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

export function SongRequestForm({ defaultFullName, defaultEmail, defaultPhone }: SongRequestFormProps = {}) {
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
      language: 'Français',
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

      const data = await response.json().catch(() => null);

      if (response.status === 401 && typeof data?.loginUrl === 'string') {
        window.location.href = data.loginUrl;
        return;
      }

      if (!response.ok) {
        setSubmitError(data?.error ?? 'Impossible d’envoyer la demande. Merci de réessayer.');
        return;
      }

      setSuccessState({
        message: 'Merci! Votre demande a été envoyée. Nous allons vous recontacter rapidement.',
      });
      setUploadedFileName(null);
      reset({ ...defaultValues, consentToBeContacted: false });
    } catch {
      setSubmitError('Connexion impossible au serveur. Vérifiez votre réseau puis réessayez.');
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
    <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
      <h3 className="text-2xl font-bold text-slate-900">Nouvelle demande</h3>
      <p className="mt-2 text-sm text-slate-600">Décris ton projet, on s'occupe du reste.</p>

      {successState ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p>{successState.message}</p>
        </div>
      ) : null}

      {submitError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <SectionCard title="Infos de base">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">Titre de la chanson</label>
              <input id="title" {...register('title')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="language">Langue</label>
              <select id="language" {...register('language')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900">
                {languageOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.language ? <p className="mt-1 text-xs text-red-600">{errors.language.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="style">Style musical</label>
              <select id="style" {...register('style')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900">
                <option value="">Sélectionner</option>
                {styleOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.style ? <p className="mt-1 text-xs text-red-600">{errors.style.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="tempo">Tempo</label>
              <select id="tempo" {...register('tempo')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900">
                {tempoOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.tempo ? <p className="mt-1 text-xs text-red-600">{errors.tempo.message}</p> : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Ambiance">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="mood">Émotion principale</label>
              <select id="mood" {...register('mood')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900">
                <option value="">Sélectionner</option>
                {moodOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.mood ? <p className="mt-1 text-xs text-red-600">{errors.mood.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="theme">Thème</label>
              <input id="theme" {...register('theme')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" placeholder="Amour, fête, motivation..." />
              {errors.theme ? <p className="mt-1 text-xs text-red-600">{errors.theme.message}</p> : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Contenu">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">Description détaillée</label>
            <textarea id="description" rows={6} {...register('description')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" placeholder="Décris l’histoire, le message, le contexte..." />
            {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="specialMessage">Message à faire passer</label>
              <input id="specialMessage" {...register('specialMessage')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
              {errors.specialMessage ? <p className="mt-1 text-xs text-red-600">{errors.specialMessage.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="recipientName">Nom de la personne</label>
              <input id="recipientName" {...register('recipientName')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
              {errors.recipientName ? <p className="mt-1 text-xs text-red-600">{errors.recipientName.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="songType">Type</label>
              <select id="songType" {...register('songType')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900">
                <option value="">Sélectionner</option>
                {songTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.songType ? <p className="mt-1 text-xs text-red-600">{errors.songType.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="eventType">Occasion</label>
              <input id="eventType" {...register('eventType')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" placeholder="Anniversaire, mariage, amour..." />
              {errors.eventType ? <p className="mt-1 text-xs text-red-600">{errors.eventType.message}</p> : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Section 4 — Inspiration">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="inspirations">Artistes ou chansons références</label>
            <textarea id="inspirations" rows={4} {...register('inspirations')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
            {errors.inspirations ? <p className="mt-1 text-xs text-red-600">{errors.inspirations.message}</p> : null}
          </div>
        </SectionCard>

        <SectionCard title="Section 5 — Texte">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lyrics">Paroles existantes</label>
            <textarea id="lyrics" rows={8} {...register('lyrics')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" placeholder="Collez ici votre texte complet si vous en avez un." />
            {errors.lyrics ? <p className="mt-1 text-xs text-red-600">{errors.lyrics.message}</p> : null}
          </div>
        </SectionCard>

        <SectionCard title="Section 6 — Structure">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="structureVerse">Couplet</label>
            <textarea id="structureVerse" rows={3} {...register('structureVerse')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
            {errors.structureVerse ? <p className="mt-1 text-xs text-red-600">{errors.structureVerse.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="structureChorus">Refrain</label>
            <textarea id="structureChorus" rows={3} {...register('structureChorus')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
            {errors.structureChorus ? <p className="mt-1 text-xs text-red-600">{errors.structureChorus.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="structureBridge">Pont (optionnel)</label>
            <textarea id="structureBridge" rows={3} {...register('structureBridge')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900" />
            {errors.structureBridge ? <p className="mt-1 text-xs text-red-600">{errors.structureBridge.message}</p> : null}
          </div>
        </SectionCard>

        <SectionCard title="Section 7 — Fichier">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="songRequestFile">Upload fichier (pdf, doc, docx)</label>
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
            <input type="hidden" {...register('fileUrl')} />
            {uploadingFile ? <p className="mt-2 text-xs text-slate-500">Upload en cours...</p> : null}
            {uploadedFileName ? <p className="mt-2 text-xs text-emerald-700">Fichier lié: {uploadedFileName}</p> : null}
            {errors.fileUrl ? <p className="mt-1 text-xs text-red-600">{errors.fileUrl.message}</p> : null}
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="fullName">Nom complet</label>
            <input id="fullName" {...register('fullName')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">Courriel</label>
            <input id="email" type="email" {...register('email')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">Téléphone</label>
          <input id="phone" type="tel" {...register('phone')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: +1 514 555 0000" />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="budget">Budget approximatif (optionnel)</label>
            <input id="budget" type="number" min="0" step="1" {...register('budget')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: 250" />
            {errors.budget ? <p className="mt-1 text-xs text-red-600">{errors.budget.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="desiredDeadline">Délai souhaité (optionnel)</label>
            <input id="desiredDeadline" type="date" {...register('desiredDeadline')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            {errors.desiredDeadline ? <p className="mt-1 text-xs text-red-600">{errors.desiredDeadline.message}</p> : null}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-1 h-4 w-4" {...register('consentToBeContacted')} />
          <span>J’accepte d’être recontacté(e) par Nowis pour le suivi de cette demande.</span>
        </label>
        {errors.consentToBeContacted ? <p className="-mt-3 text-xs text-red-600">{errors.consentToBeContacted.message}</p> : null}

        <input type="hidden" {...register('source')} value="website" />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...register('antiSpam')} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
        </Button>
      </form>
    </div>
  );
}
