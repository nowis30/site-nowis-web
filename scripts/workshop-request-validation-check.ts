import { mapWorkshopGroupTypeToOrganizationType, workshopRequestFormSchema } from '@/features/workshops/schemas';

type CaseResult = {
  name: string;
  success: boolean;
  details?: Array<{ path: string; message: string }>;
};

const basePayload = {
  organizationName: 'Organisation Test',
  contactName: 'Alice Dupont',
  role: 'Coordination',
  email: 'alice@example.com',
  phone: '8195551234',
  city: 'Drummondville',
  audienceType: 'ELEMENTARY' as const,
  ageRange: '8-10 ans',
  estimatedParticipants: 25,
  workshopTheme: 'Atelier IA musique',
  objectives: 'Objectifs pedagogiques valides pour les tests automatiques atelier.',
  residenceName: '',
  residenceUnit: '',
  seniorsProfile: '',
  coordinatorName: '',
  coordinatorRole: '',
  coordinatorEmail: '',
  coordinatorPhone: '',
  format: 'IN_PERSON' as const,
  requestedDate: '',
  preferredTime: '',
  preferredDays: ['TUESDAY'] as const,
  location: '',
  notes: '',
};

function formatIssues(error: unknown) {
  if (!(error instanceof Error) || !('issues' in error)) return [{ path: 'unknown', message: String(error) }];
  const issues = (error as { issues?: Array<{ path: Array<string | number>; message: string }> }).issues || [];
  return issues.map((issue) => ({
    path: issue.path.map((token) => String(token)).join('.') || 'root',
    message: issue.message,
  }));
}

function runCase(name: string, payload: Record<string, unknown>): CaseResult {
  const parsed = workshopRequestFormSchema.safeParse(payload);
  if (parsed.success) {
    return { name, success: true };
  }

  return {
    name,
    success: false,
    details: formatIssues(parsed.error),
  };
}

function main() {
  const c1 = runCase('C1_ECOLE_OK', {
    ...basePayload,
    groupType: 'ECOLE',
    organizationType: mapWorkshopGroupTypeToOrganizationType('ECOLE'),
  });

  const c2 = runCase('C2_AINES_COMPLET_OK', {
    ...basePayload,
    groupType: 'AINES_RESIDENCE',
    organizationName: 'Residence Soleil',
    audienceType: 'MIXED',
    residenceName: 'Residence Soleil',
    coordinatorName: 'Marie Tremblay',
    coordinatorRole: 'Coordonnatrice des loisirs',
    coordinatorEmail: 'coordination@residence.ca',
    organizationType: mapWorkshopGroupTypeToOrganizationType('AINES_RESIDENCE'),
  });

  const c3 = runCase('C3_AINES_INCOMPLET_VALIDATION_ERROR', {
    ...basePayload,
    groupType: 'AINES_RESIDENCE',
    organizationName: 'Residence Sans Coord',
    audienceType: 'MIXED',
    organizationType: mapWorkshopGroupTypeToOrganizationType('AINES_RESIDENCE'),
  });

  const c4 = runCase('C4_AUTRE_OK', {
    ...basePayload,
    groupType: 'AUTRE',
    organizationType: mapWorkshopGroupTypeToOrganizationType('AUTRE'),
  });

  const c5 = runCase('C5_AUTRE_SANS_RESIDENCE_OK', {
    ...basePayload,
    groupType: 'AUTRE',
    organizationType: mapWorkshopGroupTypeToOrganizationType('AUTRE'),
    residenceName: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
  });

  const results = [c1, c2, c3, c4, c5];
  console.log(JSON.stringify(results, null, 2));

  const isExpected = c1.success && c2.success && !c3.success && c4.success && c5.success;
  if (!isExpected) {
    process.exitCode = 1;
  }
}

main();