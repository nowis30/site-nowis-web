'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { workshopSelectClassName } from '@/components/forms/select-styles';
import { trackWorkshopRequestSubmitted } from '@/lib/tracking/google';
import { mapWorkshopGroupTypeToOrganizationType, workshopRequestFormSchema, type WorkshopRequestFormInput } from '@/features/workshops/schemas';

interface WorkshopRequestFormProps {
  accountEmail: string;
  accountFullName: string;
  accountPhone?: string;
  initialGroupType?: WorkshopRequestFormInput['groupType'];
}

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
    if (groupType === 'AINES_RESIDENCE') return 'Nom de la residence';
    if (groupType === 'PRIVE') return 'Nom du groupe / famille';
    if (groupType === 'ENTREPRISE') return 'Nom de l entreprise';
    return 'Nom de l ecole ou organisme';
  }, [groupType]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
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

    const data = await response.json().catch(() => null);
    if (response.status === 401 && typeof data?.loginUrl === 'string') {
      window.location.href = data.loginUrl;
      return;
    }
    if (!response.ok) {
      setServerError(data?.error || 'Impossible d’envoyer la demande.');
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
  });

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-8 text-white">
        <h2 className="text-2xl font-semibold">Demande envoyée</h2>
        <p className="mt-3 text-sm leading-7 text-emerald-50">Votre demande d’atelier a bien été transmise. Elle entre maintenant dans le CRM Nowis avec un suivi dédié pour l’organisation, le contact et les prochaines étapes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-sm">
      <input type="hidden" {...register('organizationType')} />

      <div className="grid gap-5 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-white">Type de groupe</span>
          <select {...register('groupType')} className={workshopSelectClassName}>
            <option value="AINES_RESIDENCE">Aines / residence</option>
            <option value="ECOLE">Ecole</option>
            <option value="ENTREPRISE">Entreprise</option>
            <option value="COMMUNAUTAIRE">Communautaire</option>
            <option value="PRIVE">Prive</option>
            <option value="AUTRE">Autre</option>
          </select>
          {errors.groupType ? <p className="mt-2 text-xs text-red-300">{errors.groupType.message}</p> : null}
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium text-white">{organizationLabel}</span>
          <input {...register('organizationName')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
          {errors.organizationName ? <p className="mt-2 text-xs text-red-300">{errors.organizationName.message}</p> : null}
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Nom de la personne contact</span>
          <input {...register('contactName')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
          {errors.contactName ? <p className="mt-2 text-xs text-red-300">{errors.contactName.message}</p> : null}
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Poste ou fonction</span>
          <input {...register('role')} placeholder="Enseignant, direction, coordination..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Email</span>
          <input type="email" {...register('email')} readOnly className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200" />
          <p className="mt-2 text-xs text-slate-400">Email de votre compte client (utilise pour lier automatiquement votre dossier).</p>
          {errors.email ? <p className="mt-2 text-xs text-red-300">{errors.email.message}</p> : null}
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Téléphone</span>
          <input {...register('phone')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
          {errors.phone ? <p className="mt-2 text-xs text-red-300">{errors.phone.message}</p> : null}
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Ville</span>
          <input {...register('city')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
          {errors.city ? <p className="mt-2 text-xs text-red-300">{errors.city.message}</p> : null}
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Format</span>
          <select {...register('format')} className={workshopSelectClassName}>
            <option value="IN_PERSON">Sur place</option>
            <option value="VIRTUAL">Virtuel</option>
            <option value="HYBRID">Hybride</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Tranche d’âge</span>
          <input {...register('ageRange')} placeholder="5 à 8 ans" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Public visé</span>
          <select {...register('audienceType')} className={workshopSelectClassName}>
            <option value="PRESCHOOL">Préscolaire</option>
            <option value="ELEMENTARY">Primaire</option>
            <option value="TEENS">Adolescents</option>
            <option value="MIXED">Groupe mixte</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Nombre approximatif de participants</span>
          <input type="number" {...register('estimatedParticipants')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Date souhaitée</span>
          <input type="date" {...register('requestedDate')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Plage préférée</span>
          <input {...register('preferredTime')} placeholder="Mardi 9h à 11h" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        </label>

        {groupType === 'AINES_RESIDENCE' ? (
          <>
            <label>
              <span className="mb-2 block text-sm font-medium text-white">Nom de la residence</span>
              <input {...register('residenceName')} placeholder="Residence des Moulins" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
              {errors.residenceName ? <p className="mt-2 text-xs text-red-300">{errors.residenceName.message}</p> : null}
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-white">Unite / secteur (optionnel)</span>
              <input {...register('residenceUnit')} placeholder="3e etage, aile A" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-white">Coordonnatrice ou coordonnateur</span>
              <input {...register('coordinatorName')} placeholder="Nom complet" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
              {errors.coordinatorName ? <p className="mt-2 text-xs text-red-300">{errors.coordinatorName.message}</p> : null}
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-white">Role de coordination</span>
              <input {...register('coordinatorRole')} placeholder="Coordonnatrice des loisirs" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-white">Email coordination</span>
              <input type="email" {...register('coordinatorEmail')} placeholder="coordination@residence.ca" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
              {errors.coordinatorEmail ? <p className="mt-2 text-xs text-red-300">{errors.coordinatorEmail.message}</p> : null}
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-white">Telephone coordination</span>
              <input {...register('coordinatorPhone')} placeholder="819 000-0000" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-white">Profil des participants (optionnel)</span>
              <textarea {...register('seniorsProfile')} rows={3} placeholder="Autonomie, capacites, contexte du groupe..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            </label>
          </>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-white">Jours préférés</legend>
        <div className="flex flex-wrap gap-4 text-sm text-slate-200">
          <label className="inline-flex items-center gap-2"><input type="checkbox" value="TUESDAY" {...register('preferredDays')} /> Mardi</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" value="THURSDAY" {...register('preferredDays')} /> Jeudi</label>
        </div>
        {errors.preferredDays ? <p className="mt-2 text-xs text-red-300">{errors.preferredDays.message}</p> : null}
      </fieldset>

      <label>
        <span className="mb-2 block text-sm font-medium text-white">Thème souhaité</span>
        <input {...register('workshopTheme')} placeholder="Écriture, musique, imagination, rythme..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        {errors.workshopTheme ? <p className="mt-2 text-xs text-red-300">{errors.workshopTheme.message}</p> : null}
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-white">Objectifs de l’atelier</span>
        <textarea {...register('objectives')} rows={5} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
        {errors.objectives ? <p className="mt-2 text-xs text-red-300">{errors.objectives.message}</p> : null}
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-white">Lieu ou contexte</span>
        <input {...register('location')} placeholder="École, salle polyvalente, lien visio..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-white">Autres informations utiles</span>
        <textarea {...register('notes')} rows={4} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
      </label>

      {serverError ? <p className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande d’atelier'}
      </Button>
    </form>
  );
}
