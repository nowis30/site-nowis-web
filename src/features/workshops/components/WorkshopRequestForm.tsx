'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { trackWorkshopRequestSubmitted } from '@/lib/tracking/google';
import { mapWorkshopGroupTypeToOrganizationType, workshopRequestFormSchema, type WorkshopRequestFormInput } from '@/features/workshops/schemas';

interface WorkshopRequestFormProps {
  accountEmail: string;
  accountFullName: string;
  accountPhone?: string;
  initialGroupType?: WorkshopRequestFormInput['groupType'];
}

const fieldClassName =
  'min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white shadow-sm outline-none transition placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none';
const readOnlyClassName =
  'min-h-12 w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-base text-slate-300 outline-none';
const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-200';
const errorClassName = 'mt-1.5 text-xs font-medium text-red-300';
const panelClassName = 'space-y-4 rounded-2xl border border-primary-500/15 bg-slate-950/45 p-4 sm:p-5';

export function WorkshopRequestForm({ accountEmail, accountFullName, accountPhone = '', initialGroupType = 'ECOLE' }: WorkshopRequestFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const lastTrackedRequestIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WorkshopRequestFormInput>({
    resolver: zodResolver(workshopRequestFormSchema),
    defaultValues: {
      groupType: initialGroupType,
      contactName: accountFullName,
      email: accountEmail,
      phone: accountPhone,
      organizationType: mapWorkshopGroupTypeToOrganizationType(initialGroupType),
      audienceType: 'ELEMENTARY',
      format: 'IN_PERSON',
      preferredDays: ['TUESDAY'],
    },
  });

  const groupType = watch('groupType');

  useEffect(() => {
    setValue('organizationType', mapWorkshopGroupTypeToOrganizationType(groupType), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [groupType, setValue]);

  const organizationLabel = useMemo(() => {
    if (groupType === 'AINES_RESIDENCE') return 'Nom de la résidence';
    if (groupType === 'PRIVE') return 'Nom du groupe / famille';
    if (groupType === 'ENTREPRISE') return 'Nom de l’entreprise';
    return 'Nom de l’école ou organisme';
  }, [groupType]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSubmitted(false);

    try {
      const normalizedGroupType = values.groupType || initialGroupType;
      const response = await fetch('/api/workshop-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          groupType: normalizedGroupType,
          organizationType: mapWorkshopGroupTypeToOrganizationType(normalizedGroupType),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        loginUrl?: string;
        redirectTo?: string;
        item?: { id?: string };
      } | null;

      if (response.status === 401 && typeof data?.loginUrl === 'string') {
        window.location.href = data.loginUrl;
        return;
      }
      if (!response.ok) {
        setServerError(data?.error || 'Impossible d’envoyer la demande. Merci de réessayer.');
        return;
      }

      const requestId = typeof data?.item?.id === 'string' ? data.item.id : null;
      const redirectTo = typeof data?.redirectTo === 'string'
        ? data.redirectTo
        : requestId
          ? `/client/workshops/${requestId}`
          : null;

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      if (requestId && lastTrackedRequestIdRef.current !== requestId) {
        trackWorkshopRequestSubmitted(requestId);
        lastTrackedRequestIdRef.current = requestId;
      }

      reset({
        groupType: normalizedGroupType,
        contactName: accountFullName,
        email: accountEmail,
        phone: accountPhone,
        organizationType: mapWorkshopGroupTypeToOrganizationType(normalizedGroupType),
        audienceType: normalizedGroupType === 'AINES_RESIDENCE' ? 'MIXED' : 'ELEMENTARY',
        format: 'IN_PERSON',
        preferredDays: ['TUESDAY'],
      });
      setSubmitted(true);
    } catch {
      setServerError('Connexion impossible au serveur. Vérifiez votre réseau puis réessayez.');
    }
  }, (invalid: FieldErrors<WorkshopRequestFormInput>) => {
    const firstKey = Object.keys(invalid)[0] as keyof WorkshopRequestFormInput | undefined;
    const firstError = firstKey ? invalid[firstKey] : undefined;
    const message = firstError && typeof firstError === 'object' && 'message' in firstError && typeof firstError.message === 'string'
      ? firstError.message
      : 'Certains champs obligatoires sont incomplets.';

    setServerError(`Formulaire incomplet : ${message}`);
    if (firstKey) setFocus(firstKey);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
  });

  if (submitted) {
    return (
      <div role="status" aria-live="polite" className="crm-surface rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-6 text-white shadow-[0_12px_34px_rgba(2,6,23,0.24)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Demande reçue</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Demande envoyée</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">Votre demande d’atelier a bien été transmise. Vous pouvez suivre la suite dans votre portail client.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="crm-surface space-y-6 rounded-3xl border border-primary-500/15 p-5 shadow-[0_12px_34px_rgba(2,6,23,0.26)] sm:p-6 md:p-8"
    >
      <input type="hidden" {...register('organizationType')} />

      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-300">Atelier personnalisé</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Parlez-nous de votre groupe</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Les informations essentielles suffisent pour démarrer. Vous pouvez préciser le contexte dans les options avancées.</p>
      </div>

      {serverError ? (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {serverError}
        </div>
      ) : null}

      <section className={panelClassName} aria-labelledby="workshop-essential-heading">
        <h3 id="workshop-essential-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">Essentiel</h3>

        <label>
          <span className={labelClassName}>Type de groupe</span>
          <select {...register('groupType')} className={fieldClassName}>
            <option value="AINES_RESIDENCE">Aînés / résidence</option>
            <option value="ECOLE">École</option>
            <option value="ENTREPRISE">Entreprise</option>
            <option value="COMMUNAUTAIRE">Communautaire</option>
            <option value="PRIVE">Privé</option>
            <option value="AUTRE">Autre</option>
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelClassName}>{organizationLabel}</span>
            <input {...register('organizationName')} className={fieldClassName} aria-invalid={Boolean(errors.organizationName)} />
            {errors.organizationName ? <p className={errorClassName}>{errors.organizationName.message}</p> : null}
          </label>
          <label>
            <span className={labelClassName}>Personne contact</span>
            <input {...register('contactName')} autoComplete="name" className={fieldClassName} aria-invalid={Boolean(errors.contactName)} />
            {errors.contactName ? <p className={errorClassName}>{errors.contactName.message}</p> : null}
          </label>

          <label>
            <span className={labelClassName}>Téléphone</span>
            <input {...register('phone')} type="tel" autoComplete="tel" inputMode="tel" className={fieldClassName} aria-invalid={Boolean(errors.phone)} />
            {errors.phone ? <p className={errorClassName}>{errors.phone.message}</p> : null}
          </label>
          <label>
            <span className={labelClassName}>Ville</span>
            <input {...register('city')} autoComplete="address-level2" className={fieldClassName} aria-invalid={Boolean(errors.city)} />
            {errors.city ? <p className={errorClassName}>{errors.city.message}</p> : null}
          </label>

          <label>
            <span className={labelClassName}>Thème de l’atelier</span>
            <input {...register('workshopTheme')} className={fieldClassName} placeholder="Écriture, rythme, création…" aria-invalid={Boolean(errors.workshopTheme)} />
            {errors.workshopTheme ? <p className={errorClassName}>{errors.workshopTheme.message}</p> : null}
          </label>
          <label>
            <span className={labelClassName}>Date souhaitée</span>
            <input type="date" {...register('requestedDate')} className={fieldClassName} />
          </label>

          <label>
            <span className={labelClassName}>Tranche d’âge</span>
            <input {...register('ageRange')} className={fieldClassName} placeholder="Ex. : 8 à 12 ans" aria-invalid={Boolean(errors.ageRange)} />
            {errors.ageRange ? <p className={errorClassName}>{errors.ageRange.message}</p> : null}
          </label>
          <label>
            <span className={labelClassName}>Nombre de participants</span>
            <input type="number" min="1" inputMode="numeric" {...register('estimatedParticipants')} className={fieldClassName} aria-invalid={Boolean(errors.estimatedParticipants)} />
            {errors.estimatedParticipants ? <p className={errorClassName}>{errors.estimatedParticipants.message}</p> : null}
          </label>
        </div>

        <label>
          <span className={labelClassName}>Objectifs de l’atelier</span>
          <textarea {...register('objectives')} rows={5} className={fieldClassName} aria-invalid={Boolean(errors.objectives)} />
          {errors.objectives ? <p className={errorClassName}>{errors.objectives.message}</p> : null}
        </label>
      </section>

      <details className="rounded-2xl border border-primary-500/15 bg-slate-950/45 p-4 sm:p-5">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold uppercase tracking-[0.14em] text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Options avancées</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelClassName}>Poste ou fonction</span>
            <input {...register('role')} className={fieldClassName} />
          </label>
          <label>
            <span className={labelClassName}>Courriel du compte</span>
            <input type="email" {...register('email')} readOnly autoComplete="email" className={readOnlyClassName} />
          </label>

          <label>
            <span className={labelClassName}>Format</span>
            <select {...register('format')} className={fieldClassName}>
              <option value="IN_PERSON">Sur place</option>
              <option value="VIRTUAL">Virtuel</option>
              <option value="HYBRID">Hybride</option>
            </select>
          </label>
          <label>
            <span className={labelClassName}>Public visé</span>
            <select {...register('audienceType')} className={fieldClassName}>
              <option value="PRESCHOOL">Préscolaire</option>
              <option value="ELEMENTARY">Primaire</option>
              <option value="TEENS">Adolescents</option>
              <option value="MIXED">Groupe mixte</option>
            </select>
          </label>

          <label>
            <span className={labelClassName}>Plage préférée</span>
            <input {...register('preferredTime')} className={fieldClassName} placeholder="Mardi, 9 h à 11 h" />
          </label>
          <fieldset>
            <legend className={labelClassName}>Jours préférés</legend>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 transition hover:border-primary-500/40 motion-reduce:transition-none">
                <input type="checkbox" value="TUESDAY" className="h-5 w-5 accent-sky-500" {...register('preferredDays')} /> Mardi
              </label>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 transition hover:border-primary-500/40 motion-reduce:transition-none">
                <input type="checkbox" value="THURSDAY" className="h-5 w-5 accent-sky-500" {...register('preferredDays')} /> Jeudi
              </label>
            </div>
            {errors.preferredDays ? <p className={errorClassName}>{errors.preferredDays.message}</p> : null}
          </fieldset>

          <label>
            <span className={labelClassName}>Lieu ou contexte</span>
            <input {...register('location')} className={fieldClassName} />
          </label>
          <label>
            <span className={labelClassName}>Autres informations</span>
            <textarea {...register('notes')} rows={3} className={fieldClassName} />
          </label>

          {groupType === 'AINES_RESIDENCE' ? (
            <>
              <label>
                <span className={labelClassName}>Nom de la résidence</span>
                <input {...register('residenceName')} className={fieldClassName} aria-invalid={Boolean(errors.residenceName)} />
                {errors.residenceName ? <p className={errorClassName}>{errors.residenceName.message}</p> : null}
              </label>
              <label>
                <span className={labelClassName}>Unité / secteur</span>
                <input {...register('residenceUnit')} className={fieldClassName} />
              </label>
              <label>
                <span className={labelClassName}>Coordonnateur(trice)</span>
                <input {...register('coordinatorName')} autoComplete="name" className={fieldClassName} aria-invalid={Boolean(errors.coordinatorName)} />
                {errors.coordinatorName ? <p className={errorClassName}>{errors.coordinatorName.message}</p> : null}
              </label>
              <label>
                <span className={labelClassName}>Rôle de coordination</span>
                <input {...register('coordinatorRole')} className={fieldClassName} />
              </label>
              <label>
                <span className={labelClassName}>Courriel de coordination</span>
                <input type="email" {...register('coordinatorEmail')} autoComplete="email" inputMode="email" className={fieldClassName} aria-invalid={Boolean(errors.coordinatorEmail)} />
                {errors.coordinatorEmail ? <p className={errorClassName}>{errors.coordinatorEmail.message}</p> : null}
              </label>
              <label>
                <span className={labelClassName}>Téléphone de coordination</span>
                <input type="tel" {...register('coordinatorPhone')} autoComplete="tel" inputMode="tel" className={fieldClassName} aria-invalid={Boolean(errors.coordinatorPhone)} />
                {errors.coordinatorPhone ? <p className={errorClassName}>{errors.coordinatorPhone.message}</p> : null}
              </label>
              <label className="md:col-span-2">
                <span className={labelClassName}>Profil des participants</span>
                <textarea {...register('seniorsProfile')} rows={3} className={fieldClassName} />
              </label>
            </>
          ) : null}
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting} className="min-h-12 w-full text-base">
        {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande d’atelier'}
      </Button>
    </form>
  );
}
