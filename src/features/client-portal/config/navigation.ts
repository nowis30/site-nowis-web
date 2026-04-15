export interface ClientPortalNavItem {
  href: string;
  label: string;
  shortLabel: string;
  matches: (pathname: string) => boolean;
}

export const clientPortalNavigation: ClientPortalNavItem[] = [
  {
    href: '/client/dashboard',
    label: 'Tableau de bord',
    shortLabel: 'Accueil',
    matches: (pathname: string) => pathname === '/client/dashboard',
  },
  {
    href: '/client/messages',
    label: 'Messages',
    shortLabel: 'Messages',
    matches: (pathname: string) => pathname === '/client/messages',
  },
  {
    href: '/client/song-requests',
    label: 'Demandes chanson',
    shortLabel: 'Chansons',
    matches: (pathname: string) => pathname === '/client/song-requests' || pathname.startsWith('/client/song-requests/'),
  },
  {
    href: '/client/workshops',
    label: 'Ateliers',
    shortLabel: 'Ateliers',
    matches: (pathname: string) => pathname === '/client/workshops' || pathname.startsWith('/client/workshops/'),
  },
  {
    href: '/client/documents',
    label: 'Documents',
    shortLabel: 'Docs',
    matches: (pathname: string) => pathname === '/client/documents',
  },
  {
    href: '/client/appointments',
    label: 'Rendez-vous',
    shortLabel: 'RDV',
    matches: (pathname: string) => pathname === '/client/appointments',
  },
];