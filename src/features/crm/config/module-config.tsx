import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';
import { ModulePageConfig } from '@/features/crm/components/modules/types';

function getText(value: unknown, fallback = '—') {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function formatDate(value: unknown): string {
  if (!value) return '—';
  if (!(value instanceof Date || typeof value === 'string')) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const contactsConfig: ModulePageConfig = {
  title: 'Contacts',
  description: 'Prospects, clients, partenaires et organisations.',
  endpoint: '/api/crm/contacts',
  defaultValues: {
    type: 'PROSPECT',
    fullName: '',
    email: '',
    phone: '',
    source: '',
    tags: [],
    notes: '',
  },
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'PROSPECT', label: 'Prospect' },
        { value: 'CLIENT', label: 'Client' },
        { value: 'PARTENAIRE', label: 'Partenaire' },
        { value: 'ORGANIZATION', label: 'Organisation' },
        { value: 'PARTICIPANT', label: 'Participant' },
      ],
    },
    { name: 'fullName', label: 'Nom complet', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'source', label: 'Source', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: [
    { key: 'fullName', header: 'Nom', render: (row) => getText(row.fullName) },
    { key: 'type', header: 'Type', render: (row) => <StatusBadge value={row.type} /> },
    { key: 'email', header: 'Email', render: (row) => getText(row.email) },
    { key: 'phone', header: 'Téléphone', render: (row) => getText(row.phone) },
    { key: 'createdAt', header: 'Créé le', render: (row) => formatDate(row.createdAt) },
  ],
};

export const casesConfig: ModulePageConfig = {
  title: 'Dossiers',
  description: 'Suivi commercial et support.',
  endpoint: '/api/crm/cases',
  defaultValues: {
    title: '',
    type: 'CLIENT',
    status: 'OPEN',
    referenceCode: '',
    description: '',
    contactId: '',
  },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'CLIENT', label: 'Client' },
        { value: 'SUPPORT', label: 'Support' },
      ],
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      options: [
        { value: 'OPEN', label: 'Ouvert' },
        { value: 'IN_PROGRESS', label: 'En cours' },
        { value: 'ON_HOLD', label: 'En pause' },
        { value: 'CLOSED', label: 'Fermé' },
      ],
    },
    { name: 'referenceCode', label: 'Référence', type: 'text', required: true },
    {
      name: 'contactId',
      label: 'Contact lié',
      type: 'select',
      sourceKey: 'contacts',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { fullName?: string }).fullName ?? ''),
      },
    },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  columns: [
    { key: 'title', header: 'Titre', render: (row) => getText(row.title) },
    { key: 'referenceCode', header: 'Référence', render: (row) => getText(row.referenceCode) },
    { key: 'type', header: 'Type', render: (row) => <StatusBadge value={row.type} /> },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => getText(getRecord(row.contact)?.fullName),
    },
    { key: 'openedAt', header: 'Ouvert le', render: (row) => formatDate(row.openedAt) },
  ],
};

export const organizationsConfig: ModulePageConfig = {
  title: 'Organisations',
  description: 'Écoles, organismes et structures partenaires pour les ateliers.',
  endpoint: '/api/crm/organizations',
  defaultValues: {
    name: '',
    type: 'SCHOOL',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    status: 'LEAD',
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'SCHOOL', label: 'École' },
        { value: 'COMMUNITY_ORG', label: 'Organisme' },
        { value: 'DAYCARE', label: 'Garderie' },
        { value: 'CAMP', label: 'Camp' },
        { value: 'OTHER', label: 'Autre' },
      ],
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      options: [
        { value: 'LEAD', label: 'Prospection' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
      ],
    },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'city', label: 'Ville', type: 'text' },
    { name: 'address', label: 'Adresse', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: [
    { key: 'name', header: 'Nom', render: (row) => getText(row.name) },
    { key: 'type', header: 'Type', render: (row) => <StatusBadge value={row.type} /> },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'city', header: 'Ville', render: (row) => getText(row.city) },
    { key: 'email', header: 'Email', render: (row) => getText(row.email) },
  ],
};

export const workshopRequestsConfig: ModulePageConfig = {
  title: 'Demandes atelier',
  description: 'Ateliers organisation/client, planification Calendly et suivi des statuts.',
  endpoint: '/api/crm/workshop-requests',
  defaultValues: {
    workshopType: 'ORGANIZATION',
    organizationId: '',
    clientId: '',
    contactId: '',
    organizationContactId: '',
    title: '',
    organizationName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    addressOrLocation: '',
    deliveryFormat: 'SUR_PLACE',
    participantEstimate: 25,
    targetAudience: 'PERSONNES_AGEES',
    durationPreset: 'M90',
    pricingMode: 'HORAIRE',
    basePrice: 120,
    discountPercent: 0,
    internalNotes: '',
    clientNotes: '',
    audienceType: 'ELEMENTARY',
    ageRange: '',
    estimatedParticipants: 25,
    requestedDate: '',
    requestedTime: '',
    preferredDays: [],
    format: 'IN_PERSON',
    location: '',
    workshopTheme: '',
    objectives: '',
    notes: '',
    status: 'EN_ATTENTE_RDV',
  },
  fields: [
    {
      name: 'workshopType',
      label: 'Type atelier',
      type: 'select',
      required: true,
      options: [
        { value: 'ORGANIZATION', label: 'Organisation' },
        { value: 'CLIENT', label: 'Client individuel' },
      ],
    },
    {
      name: 'organizationId',
      label: 'Organisation',
      type: 'select',
      sourceKey: 'organizations',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { name?: string }).name ?? ''),
      },
    },
    {
      name: 'clientId',
      label: 'Client',
      type: 'select',
      sourceKey: 'contacts',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { fullName?: string }).fullName ?? ''),
      },
    },
    { name: 'organizationName', label: 'Organisation manuelle', type: 'text' },
    { name: 'contactPerson', label: 'Personne contact', type: 'text' },
    { name: 'contactPhone', label: 'Téléphone', type: 'text' },
    { name: 'contactEmail', label: 'Courriel', type: 'text' },
    { name: 'addressOrLocation', label: 'Adresse / lieu', type: 'text' },
    {
      name: 'contactId',
      label: 'Contact CRM',
      type: 'select',
      sourceKey: 'contacts',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { fullName?: string }).fullName ?? ''),
      },
    },
    {
      name: 'organizationContactId',
      label: 'Contact organisation',
      type: 'select',
      sourceKey: 'organizationContacts',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { fullName?: string; email?: string }).fullName ?? (item as { email?: string }).email ?? ''),
      },
    },
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'workshopTheme', label: 'Thème', type: 'text', required: true },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      options: [
        { value: 'BROUILLON', label: 'Brouillon' },
        { value: 'EN_ATTENTE_RDV', label: 'En attente RDV' },
        { value: 'RDV_PLANIFIE', label: 'RDV planifié' },
        { value: 'CONFIRME', label: 'Confirmé' },
        { value: 'TERMINE', label: 'Terminé' },
        { value: 'ANNULE', label: 'Annulé' },
        { value: 'NEW', label: 'Nouvelle' },
        { value: 'CONTACTED', label: 'Contactée' },
        { value: 'SCHEDULED', label: 'Planifiée' },
        { value: 'COMPLETED', label: 'Terminée' },
        { value: 'CANCELLED', label: 'Annulée' },
      ],
    },
    {
      name: 'deliveryFormat',
      label: 'Format atelier',
      type: 'select',
      required: true,
      options: [
        { value: 'SUR_PLACE', label: 'Sur place' },
        { value: 'EN_LIGNE', label: 'En ligne' },
        { value: 'A_DETERMINER', label: 'À déterminer' },
      ],
    },
    {
      name: 'targetAudience',
      label: 'Public cible',
      type: 'select',
      required: true,
      options: [
        { value: 'PERSONNES_AGEES', label: 'Personnes âgées' },
        { value: 'JEUNES', label: 'Jeunes' },
        { value: 'ADULTES', label: 'Adultes' },
        { value: 'FAMILLE', label: 'Famille' },
        { value: 'ORGANISME', label: 'Organisme' },
        { value: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      name: 'durationPreset',
      label: 'Durée',
      type: 'select',
      required: true,
      options: [
        { value: 'M60', label: '60 min' },
        { value: 'M90', label: '90 min' },
        { value: 'M120', label: '120 min' },
        { value: 'PERSONNALISE', label: 'Personnalisée' },
      ],
    },
    {
      name: 'pricingMode',
      label: 'Tarif',
      type: 'select',
      required: true,
      options: [
        { value: 'HORAIRE', label: 'Horaire' },
        { value: 'PAR_PERSONNE', label: 'Par personne' },
        { value: 'PERSONNALISE', label: 'Personnalisé' },
      ],
    },
    { name: 'basePrice', label: 'Tarif base', type: 'number' },
    { name: 'discountPercent', label: 'Rabais %', type: 'number' },
    { name: 'participantEstimate', label: 'Participants (atelier)', type: 'number' },
    {
      name: 'audienceType',
      label: 'Public',
      type: 'select',
      required: true,
      options: [
        { value: 'PRESCHOOL', label: 'Préscolaire' },
        { value: 'ELEMENTARY', label: 'Primaire' },
        { value: 'TEENS', label: 'Adolescents' },
        { value: 'MIXED', label: 'Mixte' },
      ],
    },
    {
      name: 'format',
      label: 'Format',
      type: 'select',
      required: true,
      options: [
        { value: 'IN_PERSON', label: 'Sur place' },
        { value: 'VIRTUAL', label: 'Virtuel' },
        { value: 'HYBRID', label: 'Hybride' },
      ],
    },
    { name: 'ageRange', label: 'Tranche d’âge', type: 'text' },
    { name: 'estimatedParticipants', label: 'Participants', type: 'number' },
    { name: 'requestedDate', label: 'Date souhaitée', type: 'date' },
    { name: 'requestedTime', label: 'Plage souhaitée', type: 'text' },
    { name: 'location', label: 'Lieu', type: 'text' },
    { name: 'objectives', label: 'Objectifs', type: 'textarea' },
    { name: 'clientNotes', label: 'Notes client', type: 'textarea' },
    { name: 'internalNotes', label: 'Notes internes', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: [
    { key: 'title', header: 'Titre', render: (row) => getText(row.title) },
    { key: 'workshopType', header: 'Type', render: (row) => <StatusBadge value={row.workshopType} /> },
    { key: 'workshopTheme', header: 'Thème', render: (row) => getText(row.workshopTheme) },
    { key: 'organization', header: 'Organisation', render: (row) => getText(getRecord(row.organization)?.name, getText(row.organizationName)) },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'finalPrice', header: 'Prix final', render: (row) => getText(row.finalPrice) },
    { key: 'requestedDate', header: 'Date souhaitée', render: (row) => formatDate(row.requestedDate) },
  ],
};
