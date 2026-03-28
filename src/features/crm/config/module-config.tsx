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
        { value: 'PROPRIETAIRE', label: 'Organisation' },
        { value: 'LOCATAIRE_PROSPECT', label: 'Participant' },
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
  description: 'Suivi commercial, location, support et maintenance.',
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
        { value: 'LOCATION', label: 'Location' },
        { value: 'SUPPORT', label: 'Support' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
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

export const propertiesConfig: ModulePageConfig = {
  title: 'Immeubles',
  description: 'Gestion des propriétés et portefeuille locatif.',
  endpoint: '/api/crm/properties',
  defaultValues: {
    code: '',
    name: '',
    type: 'RESIDENTIAL',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: 'QC',
    postalCode: '',
    totalUnits: 0,
  },
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'RESIDENTIAL', label: 'Résidentiel' },
        { value: 'COMMERCIAL', label: 'Commercial' },
        { value: 'MIXED', label: 'Mixte' },
      ],
    },
    { name: 'addressLine1', label: 'Adresse', type: 'text', required: true },
    { name: 'addressLine2', label: 'Complément', type: 'text' },
    { name: 'city', label: 'Ville', type: 'text', required: true },
    { name: 'province', label: 'Province', type: 'text', required: true },
    { name: 'postalCode', label: 'Code postal', type: 'text', required: true },
    { name: 'totalUnits', label: 'Nombre de logements', type: 'number' },
  ],
  columns: [
    { key: 'code', header: 'Code', render: (row) => getText(row.code) },
    { key: 'name', header: 'Nom', render: (row) => getText(row.name) },
    { key: 'type', header: 'Type', render: (row) => <StatusBadge value={row.type} /> },
    { key: 'city', header: 'Ville', render: (row) => getText(row.city) },
    { key: 'totalUnits', header: 'Logements', render: (row) => getText(row.totalUnits, '0') },
  ],
};

export const unitsConfig: ModulePageConfig = {
  title: 'Logements',
  description: 'Gestion des unités par immeuble.',
  endpoint: '/api/crm/units',
  defaultValues: {
    propertyId: '',
    unitNumber: '',
    floor: '',
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: '',
    monthlyRent: '',
    status: 'VACANT',
  },
  fields: [
    {
      name: 'propertyId',
      label: 'Immeuble',
      type: 'select',
      required: true,
      sourceKey: 'properties',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => {
          const property = item as { name?: string; code?: string };
          return `${property.name ?? ''} (${property.code ?? ''})`;
        },
      },
    },
    { name: 'unitNumber', label: 'Numéro', type: 'text', required: true },
    { name: 'floor', label: 'Étage', type: 'text' },
    { name: 'bedrooms', label: 'Chambres', type: 'number' },
    { name: 'bathrooms', label: 'Salles de bain', type: 'number' },
    { name: 'areaSqft', label: 'Surface (pi²)', type: 'number' },
    { name: 'monthlyRent', label: 'Loyer mensuel', type: 'number' },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'VACANT', label: 'Libre' },
        { value: 'OCCUPIED', label: 'Occupé' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
      ],
    },
  ],
  columns: [
    { key: 'unitNumber', header: 'Unité', render: (row) => getText(row.unitNumber) },
    {
      key: 'property',
      header: 'Immeuble',
      render: (row) => getText(getRecord(row.property)?.name),
    },
    { key: 'bedrooms', header: 'Chambres', render: (row) => getText(row.bedrooms, '0') },
    {
      key: 'monthlyRent',
      header: 'Loyer',
      render: (row) => {
        const rent = row.monthlyRent;
        return typeof rent === 'number' || typeof rent === 'string' ? `${rent} $` : '—';
      },
    },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
  ],
};

export const tenantsConfig: ModulePageConfig = {
  title: 'Locataires',
  description: 'Gestion des profils locataires et affectation unités.',
  endpoint: '/api/crm/tenants',
  defaultValues: {
    contactId: '',
    unitId: '',
    emergencyContact: '',
    emergencyPhone: '',
    moveInDate: '',
    moveOutDate: '',
    isActive: true,
  },
  fields: [
    {
      name: 'contactId',
      label: 'Contact',
      type: 'select',
      required: true,
      sourceKey: 'contacts',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { fullName?: string }).fullName ?? ''),
      },
    },
    {
      name: 'unitId',
      label: 'Unité',
      type: 'select',
      sourceKey: 'units',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => {
          const unit = item as { unitNumber?: string; property?: { name?: string } };
          return `${unit.unitNumber ?? ''} · ${unit.property?.name ?? ''}`;
        },
      },
    },
    { name: 'moveInDate', label: 'Entrée', type: 'date' },
    { name: 'moveOutDate', label: 'Sortie', type: 'date' },
    { name: 'emergencyContact', label: 'Contact urgence', type: 'text' },
    { name: 'emergencyPhone', label: 'Téléphone urgence', type: 'text' },
    { name: 'isActive', label: 'Actif', type: 'checkbox' },
  ],
  columns: [
    {
      key: 'contact',
      header: 'Locataire',
      render: (row) => getText(getRecord(row.contact)?.fullName),
    },
    {
      key: 'unit',
      header: 'Unité',
      render: (row) => getText(getRecord(row.unit)?.unitNumber),
    },
    {
      key: 'property',
      header: 'Immeuble',
      render: (row) => {
        const unit = getRecord(row.unit);
        const property = getRecord(unit?.property);
        return getText(property?.name);
      },
    },
    { key: 'isActive', header: 'Statut', render: (row) => <StatusBadge value={row.isActive ? 'ACTIVE' : 'CLOSED'} /> },
  ],
};

export const maintenanceConfig: ModulePageConfig = {
  title: 'Maintenance',
  description: 'Tickets, priorités et suivi d’intervention.',
  endpoint: '/api/crm/maintenance',
  defaultValues: {
    propertyId: '',
    unitId: '',
    tenantId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',
  },
  fields: [
    {
      name: 'propertyId',
      label: 'Immeuble',
      type: 'select',
      required: true,
      sourceKey: 'properties',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => {
          const property = item as { name?: string; code?: string };
          return `${property.name ?? ''} (${property.code ?? ''})`;
        },
      },
    },
    {
      name: 'unitId',
      label: 'Unité',
      type: 'select',
      sourceKey: 'units',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => {
          const unit = item as { unitNumber?: string; property?: { name?: string } };
          return `${unit.unitNumber ?? ''} · ${unit.property?.name ?? ''}`;
        },
      },
    },
    {
      name: 'tenantId',
      label: 'Locataire',
      type: 'select',
      sourceKey: 'tenants',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { fullName?: string }).fullName ?? ''),
      },
    },
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'priority',
      label: 'Priorité',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Basse' },
        { value: 'MEDIUM', label: 'Moyenne' },
        { value: 'HIGH', label: 'Haute' },
        { value: 'URGENT', label: 'Urgente' },
      ],
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'OPEN', label: 'Ouvert' },
        { value: 'IN_PROGRESS', label: 'En cours' },
        { value: 'RESOLVED', label: 'Résolu' },
        { value: 'CLOSED', label: 'Fermé' },
      ],
    },
  ],
  columns: [
    { key: 'title', header: 'Ticket', render: (row) => getText(row.title) },
    {
      key: 'property',
      header: 'Immeuble',
      render: (row) => getText(getRecord(row.property)?.name),
    },
    {
      key: 'unit',
      header: 'Unité',
      render: (row) => getText(getRecord(row.unit)?.unitNumber),
    },
    { key: 'priority', header: 'Priorité', render: (row) => <StatusBadge value={row.priority} /> },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
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
  description: 'Demandes entrantes, qualification et suivi des ateliers créatifs.',
  endpoint: '/api/crm/workshop-requests',
  defaultValues: {
    organizationId: '',
    contactId: '',
    organizationContactId: '',
    title: '',
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
    status: 'NEW',
  },
  fields: [
    {
      name: 'organizationId',
      label: 'Organisation',
      type: 'select',
      required: true,
      sourceKey: 'organizations',
      sourceMapper: {
        value: (item) => String((item as { id?: string }).id ?? ''),
        label: (item) => String((item as { name?: string }).name ?? ''),
      },
    },
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
        { value: 'NEW', label: 'Nouvelle' },
        { value: 'CONTACTED', label: 'Contactée' },
        { value: 'SCHEDULED', label: 'Planifiée' },
        { value: 'COMPLETED', label: 'Terminée' },
        { value: 'CANCELLED', label: 'Annulée' },
      ],
    },
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
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: [
    { key: 'title', header: 'Titre', render: (row) => getText(row.title) },
    { key: 'workshopTheme', header: 'Thème', render: (row) => getText(row.workshopTheme) },
    { key: 'organization', header: 'Organisation', render: (row) => getText(getRecord(row.organization)?.name) },
    { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'requestedDate', header: 'Date souhaitée', render: (row) => formatDate(row.requestedDate) },
  ],
};
