import { CrmRole } from './session';

export type CrmAction = 'read' | 'create' | 'update' | 'delete';

export type CrmModuleKey =
  | 'dashboard'
  | 'contacts'
  | 'organizations'
  | 'cases'
  | 'documents'
  | 'tasks'
  | 'appointments'
  | 'invoices'
  | 'commercialQuotes'
  | 'activities'
  | 'songRequests'
  | 'workshopRequests'
  | 'settings'
  | 'notifications'
  | 'reviews';

const ADMIN_PERMISSIONS: Record<CrmModuleKey, CrmAction[]> = {
  dashboard:    ['read'],
  contacts:     ['read', 'create', 'update', 'delete'],
  organizations:['read', 'create', 'update', 'delete'],
  cases:        ['read', 'create', 'update', 'delete'],
  documents:    ['read', 'create', 'update', 'delete'],
  tasks:        ['read', 'create', 'update', 'delete'],
  appointments: ['read', 'create', 'update', 'delete'],
  invoices:     ['read', 'create', 'update', 'delete'],
  commercialQuotes: ['read', 'create', 'update', 'delete'],
  activities:   ['read', 'create', 'update', 'delete'],
  songRequests: ['read', 'create', 'update', 'delete'],
  workshopRequests: ['read', 'create', 'update', 'delete'],
  settings: ['read', 'create', 'update', 'delete'],
  notifications: ['read'],
  reviews: ['read', 'create', 'update', 'delete'],
};

const ASSISTANT_PERMISSIONS: Record<CrmModuleKey, CrmAction[]> = {
  dashboard:    ['read'],
  contacts:     ['read', 'create', 'update'],
  organizations:['read', 'create', 'update'],
  cases:        ['read', 'create', 'update'],
  documents:    ['read', 'create', 'update'],
  tasks:        ['read', 'create', 'update'],
  appointments: ['read', 'create', 'update'],
  invoices:     ['read', 'create', 'update'],
  commercialQuotes: [],
  activities:   ['read', 'create'],
  songRequests: ['read', 'create', 'update'],
  workshopRequests: ['read', 'create', 'update'],
  settings: ['read', 'create', 'update'],
  notifications: ['read'],
  reviews: ['read', 'update'],
};

const PORTAL_USER_PERMISSIONS: Record<CrmModuleKey, CrmAction[]> = {
  dashboard:    ['read'],
  contacts:     [],
  organizations: [],
  cases:        [],
  documents:    ['read'],
  tasks:        [],
  appointments: ['read'],
  invoices:     ['read'],
  commercialQuotes: [],
  activities:   [],
  songRequests: [],
  workshopRequests: [],
  settings: [],
  notifications: [],
  reviews: [],
};

const ROLE_PERMISSIONS: Record<CrmRole, Record<CrmModuleKey, CrmAction[]>> = {
  ADMIN: ADMIN_PERMISSIONS,
  ASSISTANT: ASSISTANT_PERMISSIONS,
  PORTAL_USER: PORTAL_USER_PERMISSIONS,
};

export function can(role: CrmRole, module: CrmModuleKey, action: CrmAction): boolean {
  return ROLE_PERMISSIONS[role][module].includes(action);
}

export function canAny(role: CrmRole, module: CrmModuleKey): boolean {
  return ROLE_PERMISSIONS[role][module].length > 0;
}

export function getRolePermissions(role: CrmRole) {
  return ROLE_PERMISSIONS[role];
}
