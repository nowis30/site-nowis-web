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
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-primary-500/20 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_rgba(2,6,23,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/90 md:hidden"
    >
      <div
        className="mx-auto grid w-full max-w-[88rem] gap-1 px-2 py-1.5"
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
                'relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none',
                isActive
                  ? 'bg-primary-500/15 text-primary-100 shadow-[0_0_0_1px_rgba(56,189,248,0.22)_inset]'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              ].join(' ')}
            >
              <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
              <span className="min-w-0 max-w-full truncate text-[10px] font-semibold leading-tight sm:text-[11px]">{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
