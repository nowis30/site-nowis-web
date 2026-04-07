'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Activity, Calendar, CheckSquare,
  FileText, FolderOpen, Building2, DoorOpen, UserCheck,
  Wrench, Paperclip, Bell, Star, ChevronLeft, ChevronRight, LucideIcon,
} from 'lucide-react';
import { crmNavigation } from '@/features/crm/config/navigation';
import { canAny } from '@/features/crm/auth/permissions';
import { CrmRole } from '@/features/crm/auth/session';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Activity, Calendar, CheckSquare,
  FileText, FolderOpen, Building2, DoorOpen, UserCheck,
  Wrench, Paperclip, Bell, Star,
};

interface CrmSidebarProps {
  role: CrmRole;
  isOpen: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
  className?: string;
}

export function CrmSidebar({ role, isOpen, onToggle, onNavigate, mobile = false, className = '' }: CrmSidebarProps) {
  const pathname = usePathname();

  const filteredNav = crmNavigation.filter((item) => canAny(role, item.module));
  const sections = Array.from(new Set(filteredNav.map((i) => i.section ?? '')));
  const ToggleIcon = isOpen ? ChevronLeft : ChevronRight;

  return (
    <aside className={`${mobile ? 'h-full w-full' : 'h-screen'} shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950 transition-all duration-300 ${mobile ? 'px-3 py-4' : `${isOpen ? 'w-64 px-4 py-6' : 'w-16 px-2 py-6'}`} ${className}`}>
      <div className={`mb-6 flex items-start ${isOpen || mobile ? 'justify-between px-1' : 'justify-center px-0'}`}>
        {isOpen || mobile ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-400">CRM Nowis</p>
            <h1 className="mt-0.5 text-base font-bold text-white">Musique & ateliers</h1>
          </div>
        ) : null}
        {!mobile && onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition-colors hover:border-primary-500/40 hover:text-white"
            aria-label={isOpen ? 'Réduire le menu' : 'Agrandir le menu'}
            title={isOpen ? 'Réduire le menu' : 'Agrandir le menu'}
          >
            <ToggleIcon size={16} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5">
        {sections.map((section) => {
          const items = filteredNav.filter((i) => (i.section ?? '') === section);
          return (
            <div key={section}>
              {section && (isOpen || mobile) && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {section}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 ${mobile ? 'py-2.5' : 'py-2'} text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      } ${isOpen || mobile ? 'justify-start' : 'justify-center'}`}
                    >
                      <Icon size={16} className="shrink-0" />
                      {isOpen || mobile ? item.label : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
