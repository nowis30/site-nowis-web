'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, FileText, LayoutDashboard, MessageSquare, Music4, Sparkles } from 'lucide-react';

const navItems = [
  {
    href: '/client/dashboard',
    label: 'Accueil',
    matches: (pathname: string) => pathname === '/client/dashboard',
    Icon: LayoutDashboard,
  },
  {
    href: '/client/messages',
    label: 'Messages',
    matches: (pathname: string) => pathname === '/client/messages',
    Icon: MessageSquare,
  },
  {
    href: '/client/song-requests',
    label: 'Chansons',
    matches: (pathname: string) => pathname === '/client/song-requests' || pathname.startsWith('/client/song-requests/'),
    Icon: Music4,
  },
  {
    href: '/client/workshops',
    label: 'Ateliers',
    matches: (pathname: string) => pathname === '/client/workshops' || pathname.startsWith('/client/workshops/'),
    Icon: Sparkles,
  },
  {
    href: '/client/documents',
    label: 'Docs',
    matches: (pathname: string) => pathname === '/client/documents',
    Icon: FileText,
  },
  {
    href: '/client/appointments',
    label: 'RDV',
    matches: (pathname: string) => pathname === '/client/appointments',
    Icon: CalendarDays,
  },
] as const;

export function ClientMobileBottomNav({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile du portail client"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/90 bg-slate-950/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] shadow-[0_-10px_30px_rgba(2,6,23,0.45)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-6 gap-1">
        {navItems.map(({ href, label, matches, Icon }) => {
          const isActive = matches(pathname);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
                isActive ? 'bg-primary-500/14 text-primary-100' : 'text-slate-400 hover:bg-slate-900/80 hover:text-white',
              ].join(' ')}
            >
              <Icon size={18} strokeWidth={2.1} />
              <span className="text-[10px] font-semibold leading-tight">{label}</span>
              {href === '/client/messages' && unreadMessages > 0 ? (
                <span className="absolute right-2 top-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-950">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}