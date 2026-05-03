import { z } from 'zod';
import { coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';

export const contactInputSchema = z.object({
  type: z.enum(['PROSPECT', 'CLIENT', 'PARTENAIRE', 'ORGANIZATION', 'PARTICIPANT']),
  fullName: z.string().min(2, 'Le nom doit avoir au minimum 2 caractères').max(160, 'Le nom ne peut pas dépasser 160 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(40, 'Numéro de téléphone invalide').optional(),
  companyName: z.string().max(160, 'Le nom de l\'entreprise ne peut pas dépasser 160 caractères').optional(),
  source: z.string().max(120, 'La source ne peut pas dépasser 120 caractères').optional(),
  tags: z.array(z.string().min(1, 'Les tags ne peuvent pas être vides')).default([]),
  notes: z.string().max(5000, 'Les notes ne peuvent pas dépasser 5000 caractères').optional(),
});

export const caseInputSchema = z.object({
  title: z.string().min(3, 'Le titre doit avoir au minimum 3 caractères').max(180, 'Le titre ne peut pas dépasser 180 caractères'),
  type: z.enum(['CLIENT', 'SUPPORT']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED']).default('OPEN'),
  referenceCode: z.string().min(3, 'La référence doit avoir au minimum 3 caractères').max(50, 'La référence ne peut pas dépasser 50 caractères').regex(/^[A-Z0-9\-]+$/, 'La référence doit contenir uniquement des chiffres, lettres et tirets'),
  description: z.string().max(5000, 'La description ne peut pas dépasser 5000 caractères').optional(),
  contactId: z.string().uuid('ID de contact invalide').optional().or(z.literal('')),
});

export function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function normalizeIsoDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const appointmentDateTimeSchema = z.string().trim().refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  'Date de rendez-vous invalide',
);

export const appointmentInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  startAt: appointmentDateTimeSchema,
  endAt: appointmentDateTimeSchema,
  type: z.enum(['VISIT', 'CALL', 'FOLLOWUP', 'MEETING', 'INSPECTION', 'DEADLINE', 'REMINDER', 'WORKSHOP', 'SONG_MEETING', 'OTHER']).default('MEETING'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE']).default('PENDING'),
  appointmentType: z.enum(['VISIT', 'CALL', 'FOLLOWUP', 'MEETING', 'INSPECTION', 'DEADLINE', 'REMINDER', 'WORKSHOP', 'SONG_MEETING', 'OTHER']).optional(),
  contactId: z.string().uuid().optional().or(z.literal('')),
  organizationId: z.string().uuid().optional().or(z.literal('')),
  workshopRequestId: z.string().uuid().optional().or(z.literal('')),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
  location: z.string().max(240).optional().or(z.literal('')),
  notes: z.string().max(4000).optional().or(z.literal('')),
  calendarConnectionId: z.string().uuid().optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  const startAt = new Date(value.startAt);
  const endAt = new Date(value.endAt);

  if (!Number.isNaN(startAt.getTime()) && !Number.isNaN(endAt.getTime()) && endAt <= startAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endAt'],
      message: 'La date de fin doit etre posterieure a la date de debut',
    });
  }
});

export const invoiceInputSchema = z.object({
  number: z.string().min(2).max(60),
  contactId: z.string().uuid('ID de contact invalide'),
  issueDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Date d emission invalide')
    .optional(),
  dueDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Date d echeance invalide'),
  amount: z.coerce.number().min(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'ARCHIVED', 'DELETED']).default('DRAFT'),
  description: z.string().max(2000).optional(),
});

export const activityInputSchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'MESSAGE', 'EMAIL', 'APPOINTMENT', 'INVOICE', 'PAYMENT', 'FORM', 'FORM_SUBMISSION', 'FILE', 'TASK']).default('NOTE'),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  contactId: z.string().uuid().optional().or(z.literal('')),
});

export const commercialQuoteLineInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  quantity: z.coerce.number().positive().max(100000),
  unitPrice: z.coerce.number().min(0).max(10000000),
  taxable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const commercialQuoteStatusSchema = z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED', 'ARCHIVED']);

export const commercialQuoteCreateSchema = z.object({
  title: z.string().min(2).max(240),
  description: z.string().max(4000).optional().or(z.literal('')),
  contactId: z.string().uuid().optional().or(z.literal('')),
  organizationId: z.string().uuid().optional().or(z.literal('')),
  workshopRequestId: z.string().uuid().optional().or(z.literal('')),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
  appointmentId: z.string().uuid().optional().or(z.literal('')),
  currency: z.string().min(3).max(8).default('CAD'),
  validUntil: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().max(6000).optional().or(z.literal('')),
  internalNotes: z.string().max(6000).optional().or(z.literal('')),
  lines: z.array(commercialQuoteLineInputSchema).min(1),
  status: commercialQuoteStatusSchema.optional(),
});

export const commercialQuotePatchSchema = z.object({
  title: z.string().min(2).max(240).optional(),
  description: z.string().max(4000).optional().or(z.literal('')),
  contactId: z.string().uuid().optional().or(z.literal('')),
  organizationId: z.string().uuid().optional().or(z.literal('')),
  workshopRequestId: z.string().uuid().optional().or(z.literal('')),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
  appointmentId: z.string().uuid().optional().or(z.literal('')),
  currency: z.string().min(3).max(8).optional(),
  validUntil: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().max(6000).optional().or(z.literal('')),
  internalNotes: z.string().max(6000).optional().or(z.literal('')),
  lines: z.array(commercialQuoteLineInputSchema).min(1).optional(),
  status: commercialQuoteStatusSchema.optional(),
});

export const taskInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['CALL', 'EMAIL', 'SONG', 'FOLLOW_UP']).default('FOLLOW_UP'),
  payload: z.unknown().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().or(z.literal('')),
  caseId: z.string().uuid().optional().or(z.literal('')),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  const type = coerceTaskType(value.type);
  const payload = coerceTaskPayload(value.payload);

  if (!payload) {
    return;
  }

  const stringField = (field: string) => {
    const raw = payload[field];
    return typeof raw === 'string' ? raw : undefined;
  };

  if (type === 'CALL') {
    const email = stringField('email');
    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['payload', 'email'], message: 'Email invalide pour une tâche CALL' });
    }
  }

  if (type === 'EMAIL') {
    const email = stringField('email');
    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['payload', 'email'], message: 'Email invalide pour une tâche EMAIL' });
    }
  }
}).transform((value) => {
  const normalizedType = coerceTaskType(value.type);
  const normalizedPayload = coerceTaskPayload(value.payload);

  return {
    ...value,
    type: normalizedType,
    payload: normalizedPayload,
  };
});
