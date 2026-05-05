import { CrmModuleKey } from '@/features/crm/auth/permissions';

export interface CrmNavItem {
  label: string;
  href: string;
  module: CrmModuleKey;
  icon: string;
  section?: string;
}

export const crmNavigation: CrmNavItem[] = [
  { label: 'Tableau de bord', href: '/crm/dashboard',     module: 'dashboard',     icon: 'LayoutDashboard', section: 'Vue d\'ensemble' },
  { label: 'Notifications', href: '/crm/notifications', module: 'notifications', icon: 'Bell',            section: 'Vue d\'ensemble' },
  { label: 'Contacts',      href: '/crm/contacts',      module: 'contacts',      icon: 'Users',           section: 'Relations' },
  { label: 'Organisations', href: '/crm/organizations', module: 'organizations', icon: 'Building2',       section: 'Relations' },
  { label: 'Activités',     href: '/crm/activities',    module: 'activities',    icon: 'Activity',        section: 'Suivi' },
  { label: 'Calendrier',    href: '/crm/calendar',      module: 'appointments',  icon: 'Calendar',        section: 'Suivi' },
  { label: 'Tâches',        href: '/crm/tasks',         module: 'tasks',         icon: 'CheckSquare',     section: 'Suivi' },
  { label: 'Demandes chanson', href: '/crm/song-requests', module: 'songRequests', icon: 'FileText',      section: 'Production' },
  { label: 'Demandes atelier', href: '/crm/workshop-requests', module: 'workshopRequests', icon: 'FolderOpen', section: 'Production' },
  { label: 'Fichiers',      href: '/crm/files',         module: 'documents',     icon: 'Paperclip',       section: 'Production' },
  { label: 'Soumissions commerciales', href: '/crm/commercial-quotes', module: 'commercialQuotes', icon: 'FileText', section: 'Finance' },
  { label: 'Factures',      href: '/crm/invoices',      module: 'invoices',      icon: 'FileText',        section: 'Finance' },
  { label: 'Dossiers',      href: '/crm/cases',         module: 'cases',         icon: 'FolderOpen',      section: 'Administration' },
  { label: 'Calendriers connectés', href: '/crm/admin/calendar-connections', module: 'settings', icon: 'Calendar', section: 'Administration' },
  { label: 'Paramètres',    href: '/crm/settings',      module: 'settings',      icon: 'Wrench',          section: 'Administration' },
  { label: 'Commentaires publics', href: '/crm/public-comments', module: 'reviews', icon: 'MessageSquare', section: 'Administration' },
  { label: 'Avis clients',  href: '/crm/avis',          module: 'reviews',       icon: 'Star',            section: 'Administration' },
];
