import { z } from 'zod';

export const contactInputSchema = z.object({
  type: z.enum(['PROSPECT', 'CLIENT', 'PARTENAIRE', 'PROPRIETAIRE', 'LOCATAIRE_PROSPECT']),
  fullName: z.string().min(2, 'Le nom doit avoir au minimum 2 caractères').max(160, 'Le nom ne peut pas dépasser 160 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(40, 'Numéro de téléphone invalide').optional(),
  source: z.string().max(120, 'La source ne peut pas dépasser 120 caractères').optional(),
  tags: z.array(z.string().min(1, 'Les tags ne peuvent pas être vides')).default([]),
  notes: z.string().max(5000, 'Les notes ne peuvent pas dépasser 5000 caractères').optional(),
});

export const caseInputSchema = z.object({
  title: z.string().min(3, 'Le titre doit avoir au minimum 3 caractères').max(180, 'Le titre ne peut pas dépasser 180 caractères'),
  type: z.enum(['CLIENT', 'LOCATION', 'SUPPORT', 'MAINTENANCE']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED']).default('OPEN'),
  referenceCode: z.string().min(3, 'La référence doit avoir au minimum 3 caractères').max(50, 'La référence ne peut pas dépasser 50 caractères').regex(/^[A-Z0-9\-]+$/, 'La référence doit contenir uniquement des chiffres, lettres et tirets'),
  description: z.string().max(5000, 'La description ne peut pas dépasser 5000 caractères').optional(),
  contactId: z.string().uuid('ID de contact invalide').optional().or(z.literal('')),
});

export const propertyInputSchema = z.object({
  code: z.string().min(2, 'Le code doit avoir au minimum 2 caractères').max(30, 'Le code ne peut pas dépasser 30 caractères').regex(/^[A-Z0-9\-]+$/, 'Le code doit contenir uniquement des chiffres, lettres et tirets'),
  name: z.string().min(2, 'Le nom doit avoir au minimum 2 caractères').max(180, 'Le nom ne peut pas dépasser 180 caractères'),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'MIXED']).default('RESIDENTIAL'),
  addressLine1: z.string().min(3, 'L\'adresse doit avoir au minimum 3 caractères').max(200, 'L\'adresse ne peut pas dépasser 200 caractères'),
  addressLine2: z.string().max(200, 'Le complément d\'adresse ne peut pas dépasser 200 caractères').optional(),
  city: z.string().min(2, 'La ville doit avoir au minimum 2 caractères').max(120, 'La ville ne peut pas dépasser 120 caractères'),
  province: z.string().min(2, 'La province doit avoir au minimum 2 caractères').max(80, 'La province ne peut pas dépasser 80 caractères'),
  postalCode: z.string().min(4, 'Le code postal doit avoir au minimum 4 caractères').max(20, 'Le code postal ne peut pas dépasser 20 caractères'),
  totalUnits: z.coerce.number().int('Doit être un nombre entier').min(0, 'Le nombre de logements doit être positif').default(0),
});

export const unitInputSchema = z.object({
  propertyId: z.string().uuid('ID de propriété invalide'),
  unitNumber: z.string().min(1, 'Le numéro de logement est requis').max(30, 'Le numéro ne peut pas dépasser 30 caractères'),
  floor: z.string().max(20, 'L\'étage ne peut pas dépasser 20 caractères').optional(),
  bedrooms: z.coerce.number().int('Doit être un nombre entier').min(0, 'Le nombre de chambres doit être positif').default(1),
  bathrooms: z.coerce.number().min(0, 'Le nombre de salles de bain doit être positif').default(1),
  areaSqft: z.coerce.number().int('Doit être un nombre entier').min(0, 'La surface doit être positive').optional(),
  monthlyRent: z.coerce.number().min(0, 'Le loyer doit être positif').optional(),
  status: z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE']).default('VACANT'),
});

export const tenantInputSchema = z.object({
  contactId: z.string().uuid('ID de contact invalide'),
  unitId: z.string().uuid('ID de logement invalide').optional().or(z.literal('')),
  emergencyContact: z.string().max(160, 'Le contact d\'urgence ne peut pas dépasser 160 caractères').optional(),
  emergencyPhone: z.string().max(60, 'Le numéro d\'urgence ne peut pas dépasser 60 caractères').optional(),
  moveInDate: z.string().datetime().optional(),
  moveOutDate: z.string().datetime().optional(),
  isActive: z.coerce.boolean().default(true),
});

export const maintenanceInputSchema = z.object({
  propertyId: z.string().uuid('ID de propriété invalide'),
  unitId: z.string().uuid('ID de logement invalide').optional().or(z.literal('')),
  tenantId: z.string().uuid('ID de locataire invalide').optional().or(z.literal('')),
  title: z.string().min(3, 'Le titre doit avoir au minimum 3 caractères').max(180, 'Le titre ne peut pas dépasser 180 caractères'),
  description: z.string().max(4000, 'La description ne peut pas dépasser 4000 caractères').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('OPEN'),
});

export function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function normalizeIsoDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const appointmentInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.enum(['VISIT', 'CALL', 'FOLLOWUP', 'MEETING', 'INSPECTION', 'DEADLINE', 'REMINDER']).default('MEETING'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE']).default('PENDING'),
  contactId: z.string().uuid().optional().or(z.literal('')),
  propertyId: z.string().uuid().optional().or(z.literal('')),
});

export const invoiceInputSchema = z.object({
  number: z.string().min(2).max(60),
  contactId: z.string().uuid('ID de contact invalide'),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime(),
  amount: z.coerce.number().min(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  description: z.string().max(2000).optional(),
});

export const activityInputSchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'MESSAGE', 'EMAIL', 'APPOINTMENT', 'INVOICE', 'PAYMENT', 'FORM', 'FORM_SUBMISSION', 'FILE', 'TASK']).default('NOTE'),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  contactId: z.string().uuid().optional().or(z.literal('')),
  propertyId: z.string().uuid().optional().or(z.literal('')),
});

export const taskInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().or(z.literal('')),
  caseId: z.string().uuid().optional().or(z.literal('')),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
});
