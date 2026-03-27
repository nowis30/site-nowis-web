import { z } from 'zod';

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} doit contenir au moins ${min} caractères`)
    .max(max, `${label} ne peut pas dépasser ${max} caractères`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Ce champ ne peut pas dépasser ${max} caractères`)
    .optional()
    .or(z.literal(''));

export const songRequestStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUOTED',
  'IN_PROGRESS',
  'IN_PRODUCTION',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]);

export const songRequestInputSchema = z.object({
  fullName: requiredText('Le nom complet', 2, 160),
  email: z.string().trim().email('Le courriel est invalide').max(190, 'Le courriel est trop long'),
  phone: requiredText('Le téléphone', 7, 40),
  title: requiredText('Le titre de la chanson', 2, 160),
  language: requiredText('La langue', 2, 80),
  songType: requiredText('Le type de chanson', 2, 80),
  tempo: z.enum(['LENT', 'MOYEN', 'RAPIDE'], {
    message: 'Le tempo doit être Lent, Moyen ou Rapide',
  }),
  occasion: requiredText('L’occasion', 2, 120),
  eventType: requiredText('Le type d’événement', 2, 120),
  recipientName: requiredText('Le nom de la personne concernée', 2, 160),
  specialMessage: optionalText(800),
  style: requiredText('Le style musical', 2, 120),
  mood: requiredText('L’humeur / ambiance', 2, 120),
  theme: requiredText('Le thème principal', 2, 120),
  description: requiredText('La description détaillée', 15, 4000),
  inspirations: optionalText(2000),
  lyrics: optionalText(8000),
  structureVerse: requiredText('Le couplet', 2, 1200),
  structureChorus: requiredText('Le refrain', 2, 1200),
  structureBridge: optionalText(1200),
  fileUrl: optionalText(500),
  details: requiredText('Les détails du projet', 15, 4000),
  budget: z.string().trim().max(30, 'Le budget est invalide').optional().or(z.literal('')),
  desiredDeadline: z.string().trim().max(40, 'La date souhaitée est invalide').optional().or(z.literal('')),
  consentToBeContacted: z.boolean().refine((value) => value, {
    message: 'Le consentement est requis pour envoyer la demande',
  }),
  source: z.string().trim().max(80).optional().default('website'),
  antiSpam: z.string().trim().max(0).optional().or(z.literal('')),
});

export const crmSongRequestListQuerySchema = z.object({
  q: optionalText(190),
  status: songRequestStatusSchema.optional().or(z.literal('')),
});

export const crmSongRequestPatchSchema = z.object({
  status: songRequestStatusSchema.optional(),
  action: z.enum(['mark_contacted', 'convert_appointment', 'mark_quoted', 'mark_in_production', 'mark_delivered']).optional(),
});

export type SongRequestInput = z.infer<typeof songRequestInputSchema>;
export type CrmSongRequestPatchInput = z.infer<typeof crmSongRequestPatchSchema>;
