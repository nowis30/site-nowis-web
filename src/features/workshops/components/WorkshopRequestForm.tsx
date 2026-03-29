'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { workshopRequestFormSchema, type WorkshopRequestFormInput } from '@/features/workshops/schemas';

interface WorkshopRequestFormProps {
  accountEmail: string;
  accountFullName: string;
  accountPhone?: string;
}

export function WorkshopRequestForm({ accountEmail, accountFullName, accountPhone = '' }: WorkshopRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WorkshopRequestFormInput>({
    resolver: zodResolver(workshopRequestFormSchema),
    defaultValues: {
      contactName: accountFullName,
      email: accountEmail,
      phone: accountPhone,
      organizationType: 'SCHOOL',
      audienceType: 'ELEMENTARY',
      format: 'IN_PERSON',
      preferredDays: ['TUESDAY'],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const response = await fetch('/api/workshop-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
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

    reset();
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
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-medium text-white">Nom de l’école ou organisme</span>
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
          <span className="mb-2 block text-sm font-medium text-white">Type d’organisation</span>
          <select {...register('organizationType')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white">
            <option value="SCHOOL">École</option>
            <option value="COMMUNITY_ORG">Organisme</option>
            <option value="DAYCARE">Garderie</option>
            <option value="CAMP">Camp</option>
            <option value="OTHER">Autre</option>
          </select>
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
          <select {...register('format')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white">
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
          <select {...register('audienceType')} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white">
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
