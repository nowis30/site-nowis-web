export interface ClientPortalNavItem {
  href: string;
  label: string;
  shortLabel: string;
  matches: (pathname: string) => boolean;
}

export const clientPortalNavigation: ClientPortalNavItem[] = [
  {
    href: '/client/dashboard',
    label: 'Accueil',
    shortLabel: 'Accueil',
    matches: (pathname: string) => pathname === '/client/dashboard',
  },
  {
    href: '/client/song-requests',
    label: 'Demandes',
    shortLabel: 'Demandes',
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
  {
    href: '/client/profil',
    label: 'Profil',
    shortLabel: 'Profil',
    matches: (pathname: string) => pathname === '/client/profil' || pathname.startsWith('/client/profil/'),
  },
];

export const clientPortalMobileBottomNavigation: ClientPortalNavItem[] = [
  {
    href: '/client/dashboard',
    label: 'Accueil',
    shortLabel: 'Accueil',
    matches: (pathname: string) => pathname === '/client/dashboard',
  },
  {
    href: '/client/song-requests',
    label: 'Demandes',
    shortLabel: 'Demandes',
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
  {
    href: '/client/profil',
    label: 'Profil',
    shortLabel: 'Profil',
    matches: (pathname: string) => pathname === '/client/profil' || pathname.startsWith('/client/profil/'),
  },
];