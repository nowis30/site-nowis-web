import Link from 'next/link';
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

function shortText(value: unknown, maxLength = 28) {
  const text = getText(value);
  if (text === '—' || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function buildOutlookHref(email: unknown) {
  const text = getText(email, '');
  return text ? `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(text)}` : '#';
}

function buildMailtoHref(email: unknown) {
  const text = getText(email, '');
  return text ? `mailto:${text}` : '#';
}

function buildTelHref(phone: unknown) {
  const text = getText(phone, '');
  return text ? `tel:${text.replace(/\s+/g, '')}` : '#';
}

function CopyButton({ value, label }: { value: unknown; label: string }) {
  const text = getText(value, '');
  if (!text) return null;

  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(text)}
      className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-primary-500/50 hover:text-white"
    >
      {label}
    </button>
  );
}

function InlineLinkActions({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  copyValue,
  copyLabel,
}: {
  primaryHref?: string | null;
  primaryLabel?: string;
  secondaryHref?: string | null;
  secondaryLabel?: string;
  copyValue?: unknown;
  copyLabel?: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {primaryHref ? (
        <a href={primaryHref} target="_blank" rel="noreferrer" className="rounded-md border border-primary-500/30 px-2 py-1 text-[11px] text-primary-200 hover:border-primary-400 hover:text-white">
          {primaryLabel || 'Ouvrir'}
        </a>
      ) : null}
      {secondaryHref ? (
        <a href={secondaryHref} className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:text-white">
          {secondaryLabel || 'Action'}
        </a>
      ) : null}
      {copyLabel ? <CopyButton value={copyValue} label={copyLabel} /> : null}
    </div>
  );
}

export const contactsConfig: ModulePageConfig = {
  title: 'Contacts',
  description: 'Prospects, clients, partenaires et organisations.',
  endpoint: '/api/crm/contacts',
  hideCreateForm: true,
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
    {
      key: 'fullName',
      header: 'Nom complet',
      render: (row) => (
        <div>
          <Link href={`/crm/contacts/${getText(row.id, '')}`} className="font-medium text-white hover:text-primary-200">
            {getText(row.fullName)}
          </Link>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge value={row.type} />
            <StatusBadge value={row.crmStatus || 'ACTIVE'} />
          </div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      header: 'Organisation liée',
      render: (row) => {
        const organizationId = getText(row.organizationId, '');
        const organizationName = getText(row.organizationName);
        return organizationId ? <Link href={`/crm/organizations/${organizationId}`} className="text-primary-200 hover:text-white">{organizationName}</Link> : organizationName;
      },
    },
    {
      key: 'email',
      header: 'Courriel',
      render: (row) => {
        const email = getText(row.email, '');
        if (!email) return '—';
        return (
          <div>
            <a href={buildOutlookHref(email)} target="_blank" rel="noreferrer" className="text-primary-200 hover:text-white">{email}</a>
            <InlineLinkActions primaryHref={buildOutlookHref(email)} primaryLabel="Outlook" secondaryHref={buildMailtoHref(email)} secondaryLabel="Mailto" copyValue={email} copyLabel="Copier courriel" />
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Téléphone',
      render: (row) => {
        const phone = getText(row.phone, '');
        if (!phone) return '—';
        return (
          <div>
            <a href={buildTelHref(phone)} className="text-primary-200 hover:text-white">{phone}</a>
            <InlineLinkActions secondaryHref={buildTelHref(phone)} secondaryLabel="Appeler" copyValue={phone} copyLabel="Copier téléphone" />
          </div>
        );
      },
    },
    { key: 'city', header: 'Ville', mobileHidden: true, render: (row) => getText(row.city) },
    { key: 'shortAddress', header: 'Adresse', mobileHidden: true, render: (row) => shortText(row.shortAddress) },
    { key: 'lastActivityAt', header: 'Dernière activité', mobileHidden: true, render: (row) => formatDate(row.lastActivityAt) },
    { key: 'nextAppointmentAt', header: 'Prochain rendez-vous', mobileHidden: true, render: (row) => formatDate(row.nextAppointmentAt) },
    { key: 'linkedWorkshopTitle', header: 'Atelier lié', mobileHidden: true, render: (row) => getText(row.linkedWorkshopTitle) },
    { key: 'activeCommercialItems', header: 'Facture / soumission', mobileHidden: true, render: (row) => getText(row.activeCommercialItems) },
    { key: 'createdAt', header: 'Créé le', mobileHidden: true, render: (row) => formatDate(row.createdAt) },
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
  hideCreateForm: true,
  createFormLink: {
    href: '/crm/organizations/nouveau',
    label: 'Créer une organisation',
  },
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
    {
      key: 'name',
      header: 'Organisation',
      render: (row) => (
        <div>
          <Link href={`/crm/organizations/${getText(row.id, '')}`} className="font-medium text-white hover:text-primary-200">
            {getText(row.name)}
          </Link>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge value={row.type} />
            <StatusBadge value={row.status} />
            <StatusBadge value={row.crmStatus || 'ACTIVE'} />
          </div>
        </div>
      ),
    },
    {
      key: 'primaryContact',
      header: 'Responsable principal',
      render: (row) => {
        const contact = getRecord(row.primaryContact);
        const contactId = getText(contact?.contactId || contact?.id, '');
        const label = getText(contact?.fullName);
        return contactId ? <Link href={`/crm/contacts/${contactId}`} className="text-primary-200 hover:text-white">{label}</Link> : label;
      },
    },
    {
      key: 'email',
      header: 'Courriel principal',
      render: (row) => {
        const email = getText(row.email, '');
        if (!email) return '—';
        return (
          <div>
            <a href={buildOutlookHref(email)} target="_blank" rel="noreferrer" className="text-primary-200 hover:text-white">{email}</a>
            <InlineLinkActions primaryHref={buildOutlookHref(email)} primaryLabel="Outlook" secondaryHref={buildMailtoHref(email)} secondaryLabel="Mailto" copyValue={email} copyLabel="Copier courriel" />
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Téléphone principal',
      render: (row) => {
        const phone = getText(row.phone, '');
        if (!phone) return '—';
        return (
          <div>
            <a href={buildTelHref(phone)} className="text-primary-200 hover:text-white">{phone}</a>
            <InlineLinkActions secondaryHref={buildTelHref(phone)} secondaryLabel="Appeler" copyValue={phone} copyLabel="Copier téléphone" />
          </div>
        );
      },
    },
    { key: 'city', header: 'Ville', mobileHidden: true, render: (row) => getText(row.city) },
    { key: 'address', header: 'Adresse', mobileHidden: true, render: (row) => shortText(row.address) },
    { key: 'contactCount', header: 'Contacts', mobileHidden: true, render: (row) => getText(row.contactCount) },
    { key: 'workshopCount', header: 'Ateliers liés', mobileHidden: true, render: (row) => getText(row.workshopCount) },
    { key: 'nextEventAt', header: 'Prochain événement', mobileHidden: true, render: (row) => formatDate(row.nextEventAt) },
    { key: 'activeCommercialItems', header: 'Factures / soumissions', mobileHidden: true, render: (row) => getText(row.activeCommercialItems) },
    { key: 'lastActivityAt', header: 'Dernière activité', mobileHidden: true, render: (row) => formatDate(row.lastActivityAt) },
    { key: 'createdAt', header: 'Créée le', mobileHidden: true, render: (row) => formatDate(row.createdAt) },
  ],
};

export const workshopRequestsConfig: ModulePageConfig = {
  title: 'Demandes atelier',
  description: 'Ateliers organisation/client, planification Calendly et suivi des statuts.',
  endpoint: '/api/crm/workshop-requests',
  defaultValues: {
    workshopType: 'ORGANIZATION',
    groupType: 'COMMUNAUTAIRE',
    organizationId: '',
    clientId: '',
    contactId: '',
    organizationContactId: '',
    title: '',
    organizationName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    residenceName: '',
    residenceUnit: '',
    seniorsProfile: '',
    coordinatorName: '',
    coordinatorRole: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
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
      name: 'groupType',
      label: 'Categorie groupe',
      type: 'select',
      required: true,
      options: [
        { value: 'AINES_RESIDENCE', label: 'Aines / residence' },
        { value: 'ECOLE', label: 'Ecole' },
        { value: 'ENTREPRISE', label: 'Entreprise' },
        { value: 'COMMUNAUTAIRE', label: 'Communautaire' },
        { value: 'PRIVE', label: 'Prive' },
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
    { name: 'residenceName', label: 'Residence', type: 'text' },
    { name: 'residenceUnit', label: 'Unite / secteur', type: 'text' },
    { name: 'coordinatorName', label: 'Coordonnateur', type: 'text' },
    { name: 'coordinatorRole', label: 'Role coordination', type: 'text' },
    { name: 'coordinatorEmail', label: 'Courriel coordination', type: 'text' },
    { name: 'coordinatorPhone', label: 'Telephone coordination', type: 'text' },
    { name: 'seniorsProfile', label: 'Profil aines', type: 'textarea' },
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
    {
      key: 'title',
      header: 'Atelier',
      render: (row) => (
        <div>
          <Link href={`/crm/workshop-requests/${getText(row.id, '')}`} className="font-medium text-white hover:text-primary-200">
            {getText(row.title)}
          </Link>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge value={row.workshopType} />
            <StatusBadge value={row.status} />
            <StatusBadge value={row.groupType || 'COMMUNAUTAIRE'} />
          </div>
        </div>
      ),
    },
    { key: 'workshopTheme', header: 'Thème', render: (row) => getText(row.workshopTheme) },
    {
      key: 'organization',
      header: 'Organisation / client',
      render: (row) => {
        const organization = getRecord(row.organization);
        const contact = getRecord(row.contact) || getRecord(row.client);
        if (organization?.id) {
          return <Link href={`/crm/organizations/${getText(organization.id, '')}`} className="text-primary-200 hover:text-white">{getText(organization.name, getText(row.organizationName))}</Link>;
        }
        if (contact?.id) {
          return <Link href={`/crm/contacts/${getText(contact.id, '')}`} className="text-primary-200 hover:text-white">{getText(contact.fullName)}</Link>;
        }
        return getText(row.organizationName);
      },
    },
    {
      key: 'responsible',
      header: 'Responsable',
      render: (row) => {
        const contact = getRecord(row.organizationContact) || getRecord(row.contact) || getRecord(row.client);
        const contactId = getText(contact?.contactId || contact?.id, '');
        const label = getText(contact?.fullName, getText(row.contactPerson));
        return contactId ? <Link href={`/crm/contacts/${contactId}`} className="text-primary-200 hover:text-white">{label}</Link> : label;
      },
    },
    { key: 'contactEmail', header: 'Courriel', mobileHidden: true, render: (row) => getText(row.contactEmail) },
    { key: 'contactPhone', header: 'Téléphone', mobileHidden: true, render: (row) => getText(row.contactPhone) },
    { key: 'finalPrice', header: 'Prix', mobileHidden: true, render: (row) => getText(row.finalPrice) },
    { key: 'requestedDate', header: 'Date souhaitée', mobileHidden: true, render: (row) => formatDate(row.requestedDate) },
    { key: 'nextAppointmentAt', header: 'Horaire', mobileHidden: true, render: (row) => formatDate(row.nextAppointmentAt) },
  ],
};
