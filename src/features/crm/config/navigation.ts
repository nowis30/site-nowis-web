import { CrmModuleKey } from '@/features/crm/auth/permissions';

export interface CrmNavItem {
  label: string;
  href: string;
  module: CrmModuleKey;
  icon: string;
  section?: string;
}

export const crmNavigation: CrmNavItem[] = [
  { label: 'Dashboard',     href: '/crm/dashboard',     module: 'dashboard',     icon: 'LayoutDashboard', section: 'Vue d\'ensemble' },
  { label: 'Contacts',      href: '/crm/contacts',      module: 'contacts',      icon: 'Users',           section: 'Personnes' },
  { label: 'Notifications', href: '/crm/notifications', module: 'notifications', icon: 'Bell',            section: 'Vue d\'ensemble' },
  { label: 'Activités',     href: '/crm/activities',    module: 'activities',    icon: 'Activity',        section: 'Activités' },
  { label: 'Calendrier',    href: '/crm/calendar',      module: 'appointments',  icon: 'Calendar',        section: 'Activités' },
  { label: 'Tâches',        href: '/crm/tasks',         module: 'tasks',         icon: 'CheckSquare',     section: 'Activités' },
  { label: 'Demandes chanson', href: '/crm/song-requests', module: 'songRequests', icon: 'FileText',      section: 'Activités' },
  { label: 'Factures',      href: '/crm/invoices',      module: 'invoices',      icon: 'FileText',        section: 'Finance' },
  { label: 'Dossiers',      href: '/crm/cases',         module: 'cases',         icon: 'FolderOpen',      section: 'Gestion' },
  { label: 'Immeubles',     href: '/crm/properties',    module: 'properties',    icon: 'Building2',       section: 'Immobilier' },
  { label: 'Logements',     href: '/crm/units',         module: 'units',         icon: 'DoorOpen',        section: 'Immobilier' },
  { label: 'Locataires',    href: '/crm/tenants',       module: 'tenants',       icon: 'UserCheck',       section: 'Immobilier' },
  { label: 'Maintenance',   href: '/crm/maintenance',   module: 'maintenance',   icon: 'Wrench',          section: 'Immobilier' },
  { label: 'Fichiers',      href: '/crm/files',         module: 'documents',     icon: 'Paperclip',       section: 'Documents' },
];
