'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, CircleUser, FileText, Home, Music4, Sparkles, type LucideIcon } from 'lucide-react';
import { clientPortalMobileBottomNavigation } from '@/features/client-portal/config/navigation';

const navIcons: Record<string, LucideIcon> = {
  '/client/dashboard': Home,
  '/client/song-requests': Music4,
  '/client/workshops': Sparkles,
  '/client/soumissions': FileText,
  '/client/documents': FileText,
  '/client/appointments': CalendarDays,
  '/client/profil': CircleUser,
} as const;

export function ClientMobileBottomNav() {
  const pathname = usePathname();
  // Keep the mobile bar focused on the primary tabs.
  const primaryMobileItems = clientPortalMobileBottomNavigation.filter((item) => item.href !== '/client/profil');

  return (
    <nav
      aria-label="Navigation mobile du portail client"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-slate-700/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_24px_rgba(2,6,23,0.18)] backdrop-blur md:hidden"
    >
      <div
        className="mx-auto grid w-full max-w-[88rem] gap-1 px-2 py-1"
        style={{ gridTemplateColumns: `repeat(${primaryMobileItems.length}, minmax(0, 1fr))` }}
      >
        {primaryMobileItems.map(({ href, shortLabel, matches }) => {
          const isActive = matches(pathname);
          const Icon = navIcons[href] ?? FileText;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              title={shortLabel}
              className={[
                'relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
                isActive ? 'bg-slate-900 text-white shadow-[0_0_0_1px_rgba(15,23,42,0.22)_inset]' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon size={15} strokeWidth={2.1} />
              <span className="min-w-0 truncate text-[10px] font-semibold leading-tight">{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}