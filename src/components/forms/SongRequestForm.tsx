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
const moodOptions = ['Heureux', 'Triste', 'Motivant', 'Émotive', 'Festive', 'Inspirante', 'Douce', 'Énergique', 'Sincère', 'Autre'];
const languageOptions = [
  { value: 'Francais', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Bilingue', label: 'Bilingue' },
  { value: 'Autre', label: 'Autre' },
];
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

const fieldClassName =
  'min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white shadow-sm outline-none transition placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';
const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-200';
const errorClassName = 'mt-1.5 text-xs font-medium text-red-300';
const panelClassName = 'space-y-4 rounded-2xl border border-primary-500/15 bg-slate-950/45 p-4 sm:p-5';

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
        setSubmitError(data?.error ?? 'Impossible d’envoyer la demande. Merci de réessayer.');
        return;
      }

      const redirectTo = data?.redirectTo || (data?.id ? `/client/song-requests/${data.id}` : null);
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      setSuccessState({
        message: 'Merci. Votre demande a été envoyée.',
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

    setSubmitError(`Formulaire incomplet : ${message}`);
    if (firstKey) {
      setFocus(firstKey);
    }
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
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
      const data = (await response.json().catch(() => null)) as {
        fileName?: string;
        fileUrl?: string;
        error?: string;
        loginUrl?: string;
      } | null;
      if (response.status === 401 && typeof data?.loginUrl === 'string') {
        window.location.href = data.loginUrl;
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error || 'Téléversement impossible');
      }
      setUploadedFileName(data?.fileName || file.name);
      setValue('fileUrl', data?.fileUrl ?? '', { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Téléversement impossible');
    } finally {
      setUploadingFile(false);
    }
  }

  return (
    <div className="crm-surface rounded-3xl border border-primary-500/15 p-5 shadow-[0_12px_34px_rgba(2,6,23,0.26)] sm:p-6 md:p-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-300">Création personnalisée</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Nouvelle demande</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">Commencez par l’essentiel. Les détails avancés restent optionnels et peuvent être ajoutés au besoin.</p>
      </div>

      {successState ? (
        <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <p>{successState.message}</p>
        </div>
      ) : null}

      {submitError ? (
        <div role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {submitError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate aria-busy={isSubmitting || uploadingFile}>
        <section className={panelClassName} aria-labelledby="song-request-essential-heading">
          <h4 id="song-request-essential-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">Essentiel</h4>

          <div>
            <label className={labelClassName} htmlFor="eventType">Titre ou occasion</label>
            <input id="eventType" {...register('eventType')} className={fieldClassName} placeholder="Anniversaire, hommage, retraite…" aria-invalid={Boolean(errors.eventType)} />
            {errors.eventType ? <p className={errorClassName}>{errors.eventType.message}</p> : null}
          </div>

          <div>
            <label className={labelClassName} htmlFor="recipientName">Personne concernée</label>
            <input id="recipientName" {...register('recipientName')} className={fieldClassName} placeholder="Nom ou prénom" aria-invalid={Boolean(errors.recipientName)} />
            {errors.recipientName ? <p className={errorClassName}>{errors.recipientName.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="mood">Émotion</label>
              <select id="mood" {...register('mood')} className={fieldClassName} aria-invalid={Boolean(errors.mood)}>
                <option value="">Sélectionner</option>
                {moodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {errors.mood ? <p className={errorClassName}>{errors.mood.message}</p> : null}
            </div>
            <div>
              <label className={labelClassName} htmlFor="style">Style musical</label>
              <select id="style" {...register('style')} className={fieldClassName} aria-invalid={Boolean(errors.style)}>
                <option value="">Sélectionner</option>
                {styleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {errors.style ? <p className={errorClassName}>{errors.style.message}</p> : null}
            </div>
          </div>

          <div>
            <label className={labelClassName} htmlFor="description">Histoire / message</label>
            <textarea id="description" rows={5} {...register('description')} className={fieldClassName} placeholder="Expliquez l’histoire, les éléments importants et le ton souhaité…" aria-invalid={Boolean(errors.description)} />
            {errors.description ? <p className={errorClassName}>{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="desiredDeadline">Date souhaitée (optionnel)</label>
              <input id="desiredDeadline" type="date" {...register('desiredDeadline')} className={fieldClassName} aria-invalid={Boolean(errors.desiredDeadline)} />
              {errors.desiredDeadline ? <p className={errorClassName}>{errors.desiredDeadline.message}</p> : null}
            </div>
            <div>
              <label className={labelClassName} htmlFor="songRequestFile">Fichier (optionnel)</label>
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
                className={`${fieldClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-100`}
                disabled={uploadingFile || isSubmitting}
              />
              <input type="hidden" {...register('fileUrl')} />
              {uploadingFile ? <p className="mt-2 text-xs text-slate-400" role="status">Téléversement en cours…</p> : null}
              {uploadedFileName ? <p className="mt-2 text-xs text-emerald-200">Fichier lié : {uploadedFileName}</p> : null}
            </div>
          </div>
        </section>

        <details className="rounded-2xl border border-primary-500/15 bg-slate-950/45 p-4 sm:p-5">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold uppercase tracking-[0.14em] text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Options avancées</summary>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="title">Titre interne</label>
                <input id="title" {...register('title')} className={fieldClassName} />
              </div>
              <div>
                <label className={labelClassName} htmlFor="songType">Type de chanson</label>
                <input id="songType" {...register('songType')} className={fieldClassName} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClassName} htmlFor="language">Langue</label>
                <select id="language" {...register('language')} className={fieldClassName}>
                  {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="tempo">Tempo</label>
                <select id="tempo" {...register('tempo')} className={fieldClassName}>
                  {tempoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="theme">Thème</label>
                <input id="theme" {...register('theme')} className={fieldClassName} />
              </div>
            </div>

            <div>
              <label className={labelClassName} htmlFor="specialMessage">Message spécial</label>
              <input id="specialMessage" {...register('specialMessage')} className={fieldClassName} />
            </div>

            <div>
              <label className={labelClassName} htmlFor="inspirations">Inspirations</label>
              <textarea id="inspirations" rows={3} {...register('inspirations')} className={fieldClassName} />
            </div>

            <div>
              <label className={labelClassName} htmlFor="lyrics">Paroles</label>
              <textarea id="lyrics" rows={5} {...register('lyrics')} className={fieldClassName} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="structureVerse">Structure couplet</label>
                <textarea id="structureVerse" rows={3} {...register('structureVerse')} className={fieldClassName} />
              </div>
              <div>
                <label className={labelClassName} htmlFor="structureChorus">Structure refrain</label>
                <textarea id="structureChorus" rows={3} {...register('structureChorus')} className={fieldClassName} />
              </div>
            </div>

            <div>
              <label className={labelClassName} htmlFor="structureBridge">Structure pont</label>
              <textarea id="structureBridge" rows={3} {...register('structureBridge')} className={fieldClassName} />
            </div>

            <div>
              <label className={labelClassName} htmlFor="budget">Budget (optionnel)</label>
              <input id="budget" type="number" min="0" step="1" inputMode="numeric" {...register('budget')} className={fieldClassName} />
            </div>
          </div>
        </details>

        <section className={panelClassName} aria-labelledby="song-request-contact-heading">
          <h4 id="song-request-contact-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">Coordonnées</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="fullName">Nom complet</label>
              <input id="fullName" autoComplete="name" {...register('fullName')} className={fieldClassName} aria-invalid={Boolean(errors.fullName)} />
              {errors.fullName ? <p className={errorClassName}>{errors.fullName.message}</p> : null}
            </div>
            <div>
              <label className={labelClassName} htmlFor="email">Courriel</label>
              <input id="email" type="email" autoComplete="email" inputMode="email" {...register('email')} className={fieldClassName} aria-invalid={Boolean(errors.email)} />
              {errors.email ? <p className={errorClassName}>{errors.email.message}</p> : null}
            </div>
          </div>
          <div>
            <label className={labelClassName} htmlFor="phone">Téléphone</label>
            <input id="phone" type="tel" autoComplete="tel" inputMode="tel" {...register('phone')} className={fieldClassName} aria-invalid={Boolean(errors.phone)} />
            {errors.phone ? <p className={errorClassName}>{errors.phone.message}</p> : null}
          </div>
        </section>

        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-primary-500/15 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-slate-200 transition hover:border-primary-500/30 motion-reduce:transition-none">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-sky-500" {...register('consentToBeContacted')} />
          <span>J’accepte d’être recontacté(e) par NOWIS pour le suivi de cette demande.</span>
        </label>

        <input type="hidden" {...register('source')} value="website" />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...register('antiSpam')} />

        <Button type="submit" className="min-h-12 w-full text-base" disabled={isSubmitting || uploadingFile}>
          {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
        </Button>
      </form>
    </div>
  );
}
