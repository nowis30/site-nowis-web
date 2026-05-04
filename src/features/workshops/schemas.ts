import { z } from 'zod';

export const organizationTypeSchema = z.enum(['SCHOOL', 'COMMUNITY_ORG', 'DAYCARE', 'CAMP', 'OTHER']);
export const organizationStatusSchema = z.enum(['ACTIVE', 'LEAD', 'INACTIVE']);
export const workshopAudienceTypeSchema = z.enum(['PRESCHOOL', 'ELEMENTARY', 'TEENS', 'MIXED']);
export const workshopFormatSchema = z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID']);
export const workshopRequestTypeSchema = z.enum(['ORGANIZATION', 'CLIENT']);
export const workshopDeliveryFormatSchema = z.enum(['SUR_PLACE', 'EN_LIGNE', 'A_DETERMINER']);
export const workshopTargetAudienceSchema = z.enum(['PERSONNES_AGEES', 'JEUNES', 'ADULTES', 'FAMILLE', 'ORGANISME', 'AUTRE']);
export const workshopGroupTypeSchema = z.enum(['AINES_RESIDENCE', 'ECOLE', 'ENTREPRISE', 'COMMUNAUTAIRE', 'PRIVE', 'AUTRE']);
export const workshopDurationPresetSchema = z.enum(['M60', 'M90', 'M120', 'PERSONNALISE']);
export const workshopPricingModeSchema = z.enum(['HORAIRE', 'PAR_PERSONNE', 'PERSONNALISE']);
export const workshopRequestStatusSchema = z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'DELETED']);
export const workshopAtelierStatusSchema = z.enum(['BROUILLON', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE']);
export const workshopAppointmentStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE']);

export function mapWorkshopGroupTypeToOrganizationType(groupType?: z.infer<typeof workshopGroupTypeSchema>) {
  switch (groupType) {
    case 'ECOLE':
      return 'SCHOOL' as const;
    case 'COMMUNAUTAIRE':
    case 'AINES_RESIDENCE':
      return 'COMMUNITY_ORG' as const;
    case 'PRIVE':
      return 'OTHER' as const;
    case 'ENTREPRISE':
      return 'OTHER' as const;
    default:
      return 'OTHER' as const;
  }
}

export const workshopRequestFormSchema = z.object({
  groupType: workshopGroupTypeSchema,
  organizationName: z.string().trim().min(2, 'Le nom de l’organisation est requis').max(160),
  contactName: z.string().trim().min(2, 'Le nom de la personne contact est requis').max(160),
  role: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().toLowerCase().email('Adresse email invalide'),
  phone: z.string().trim().min(7, 'Le téléphone est requis').max(40),
  organizationType: organizationTypeSchema,
  city: z.string().trim().min(2, 'La ville est requise').max(120),
  audienceType: workshopAudienceTypeSchema,
  ageRange: z.string().trim().min(2, 'La tranche d’âge est requise').max(120),
  estimatedParticipants: z.coerce.number().int().min(1, 'Le nombre de participants doit être supérieur à 0').max(5000),
  workshopTheme: z.string().trim().min(3, 'Le thème est requis').max(180),
  objectives: z.string().trim().min(10, 'Précisez les objectifs de l’atelier').max(4000),
  residenceName: z.string().trim().max(180).optional().or(z.literal('')),
  residenceUnit: z.string().trim().max(180).optional().or(z.literal('')),
  seniorsProfile: z.string().trim().max(600).optional().or(z.literal('')),
  coordinatorName: z.string().trim().max(160).optional().or(z.literal('')),
  coordinatorRole: z.string().trim().max(120).optional().or(z.literal('')),
  coordinatorEmail: z.string().trim().toLowerCase().email('Adresse email invalide').optional().or(z.literal('')),
  coordinatorPhone: z.string().trim().max(40).optional().or(z.literal('')),
  format: workshopFormatSchema,
  requestedDate: z.string().trim().optional().or(z.literal('')),
  preferredTime: z.string().trim().max(120).optional().or(z.literal('')),
  preferredDays: z.array(z.enum(['TUESDAY', 'THURSDAY'])).min(1, 'Choisissez au moins un jour préféré'),
  location: z.string().trim().max(240).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  if (value.groupType === 'AINES_RESIDENCE') {
    const coordinatorEmail = value.coordinatorEmail?.trim() || '';
    const coordinatorPhone = value.coordinatorPhone?.trim() || '';

    if (!value.residenceName || value.residenceName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['residenceName'],
        message: 'Le nom de la résidence est requis pour ce type de groupe.',
      });
    }
    if (!value.coordinatorName || value.coordinatorName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coordinatorName'],
        message: 'Le nom de la personne coordonnatrice est requis.',
      });
    }
    if (!coordinatorEmail && !coordinatorPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coordinatorEmail'],
        message: 'Ajoutez un courriel ou un téléphone pour la coordination.',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coordinatorPhone'],
        message: 'Ajoutez un courriel ou un téléphone pour la coordination.',
      });
    }
  }
});

export const organizationInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: organizationTypeSchema.default('OTHER'),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  billingCompanyName: z.string().trim().max(160).optional().or(z.literal('')),
  billingLegalName: z.string().trim().max(160).optional().or(z.literal('')),
  billingEmail: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  billingPhone: z.string().trim().max(40).optional().or(z.literal('')),
  billingAddressLine1: z.string().trim().max(240).optional().or(z.literal('')),
  billingAddressLine2: z.string().trim().max(240).optional().or(z.literal('')),
  billingCity: z.string().trim().max(120).optional().or(z.literal('')),
  billingState: z.string().trim().max(120).optional().or(z.literal('')),
  billingPostalCode: z.string().trim().max(40).optional().or(z.literal('')),
  billingCountry: z.string().trim().max(120).optional().or(z.literal('')),
  billingTaxId: z.string().trim().max(80).optional().or(z.literal('')),
  billingNotes: z.string().trim().max(2000).optional().or(z.literal('')),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  status: organizationStatusSchema.default('LEAD'),
});

export const workshopRequestInputSchema = z.object({
  organizationId: z.string().uuid('Organisation invalide').optional().or(z.literal('')),
  contactId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  organizationContactId: z.string().uuid().optional().or(z.literal('')),
  workshopType: workshopRequestTypeSchema.default('ORGANIZATION'),
  groupType: workshopGroupTypeSchema.optional(),
  title: z.string().trim().min(3).max(180),
  organizationName: z.string().trim().max(160).optional().or(z.literal('')),
  contactPerson: z.string().trim().max(160).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')),
  contactEmail: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  residenceName: z.string().trim().max(180).optional().or(z.literal('')),
  residenceUnit: z.string().trim().max(180).optional().or(z.literal('')),
  seniorsProfile: z.string().trim().max(600).optional().or(z.literal('')),
  coordinatorName: z.string().trim().max(160).optional().or(z.literal('')),
  coordinatorRole: z.string().trim().max(120).optional().or(z.literal('')),
  coordinatorEmail: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  coordinatorPhone: z.string().trim().max(40).optional().or(z.literal('')),
  addressOrLocation: z.string().trim().max(240).optional().or(z.literal('')),
  deliveryFormat: workshopDeliveryFormatSchema.default('A_DETERMINER'),
  participantEstimate: z.coerce.number().int().min(1).max(5000).optional(),
  targetAudience: workshopTargetAudienceSchema.default('AUTRE'),
  durationPreset: workshopDurationPresetSchema.default('M90'),
  durationCustomMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  pricingMode: workshopPricingModeSchema.default('HORAIRE'),
  basePrice: z.coerce.number().min(0).max(999999).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  finalPrice: z.coerce.number().min(0).max(999999).optional(),
  internalNotes: z.string().trim().max(4000).optional().or(z.literal('')),
  clientNotes: z.string().trim().max(4000).optional().or(z.literal('')),
  calendlyEventUri: z.string().url().optional().or(z.literal('')),
  calendlyInviteeUri: z.string().url().optional().or(z.literal('')),
  calendlyUrl: z.string().url().optional().or(z.literal('')),
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
  startAt: z.string().datetime().optional().or(z.literal('')),
  endAt: z.string().datetime().optional().or(z.literal('')),
  durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  meetingType: z.string().trim().max(80).optional().or(z.literal('')),
  audienceType: workshopAudienceTypeSchema.default('MIXED'),
  ageRange: z.string().trim().max(120).optional().or(z.literal('')),
  estimatedParticipants: z.coerce.number().int().min(1).max(5000).optional(),
  requestedDate: z.string().trim().optional().or(z.literal('')),
  requestedTime: z.string().trim().max(120).optional().or(z.literal('')),
  preferredDays: z.array(z.enum(['TUESDAY', 'THURSDAY'])).default([]),
  format: workshopFormatSchema.default('IN_PERSON'),
  location: z.string().trim().max(240).optional().or(z.literal('')),
  workshopTheme: z.string().trim().min(3).max(180),
  objectives: z.string().trim().min(10).max(4000),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  status: z.union([workshopRequestStatusSchema, workshopAtelierStatusSchema]).default('EN_ATTENTE_RDV'),
});

export const workshopAvailabilityInputSchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  isActive: z.coerce.boolean().default(true),
  capacity: z.coerce.number().int().min(1).max(1000).optional(),
});

export const workshopAppointmentInputSchema = z.object({
  workshopRequestId: z.string().uuid(),
  organizationId: z.string().uuid(),
  contactId: z.string().uuid().optional().or(z.literal('')),
  organizationContactId: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: workshopAppointmentStatusSchema.default('PENDING'),
  location: z.string().trim().max(240).optional().or(z.literal('')),
});

export type WorkshopRequestFormInput = z.input<typeof workshopRequestFormSchema>;
