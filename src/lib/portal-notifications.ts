export const PORTAL_NOTIFICATION_CHANNELS = [
  'portal',
  'portal-message',
  'portal-payment',
  'portal-task',
  'portal-maintenance',
] as const;

export type PortalNotificationChannel = (typeof PORTAL_NOTIFICATION_CHANNELS)[number];

export function isPortalNotificationChannel(channel: string) {
  return PORTAL_NOTIFICATION_CHANNELS.includes(channel as PortalNotificationChannel);
}

export function getPortalNotificationLabel(channel: string) {
  switch (channel) {
    case 'portal-payment':
      return 'Paiement';
    case 'portal-task':
      return 'Tâche';
    case 'portal-maintenance':
      return 'Maintenance';
    case 'portal-message':
    case 'portal':
    default:
      return 'Message';
  }
}

export function getPortalNotificationHref(item: {
  linkedType: string;
  linkedId: string;
  tenantId: string | null;
  contactId: string | null;
}) {
  switch (item.linkedType) {
    case 'SONG_REQUEST':
      return `/crm/song-requests/${item.linkedId}`;
    case 'INVOICE':
      return `/crm/invoices/${item.linkedId}`;
    case 'MAINTENANCE_TICKET':
      return `/crm/maintenance/${item.linkedId}`;
    case 'TENANT':
      return item.tenantId ? `/crm/tenants/${item.tenantId}` : '/crm/tenants';
    case 'CONTACT':
      return item.contactId ? `/crm/contacts/${item.contactId}` : '/crm/contacts';
    default:
      return '/crm/dashboard';
  }
}