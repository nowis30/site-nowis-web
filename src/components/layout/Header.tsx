'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShareMenu } from '@/components/radio/ShareMenu';
import { VisitorCounters } from '@/components/analytics/VisitorCounters';

const primary = [
  {label: 'Chansons personnalisées', href: '/commander-une-chanson'},
  {label: 'Écouter', href: '/musique'},
  {label: 'Radio', href: '/radio'},
  {label: 'Ateliers', href: '/ateliers'},
  {label: 'Tarot', href: '/tarot'},
  {label: 'Explorer', href: '/explorer'},
];
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    let active = true;
    const measure = () => {
      if (active) document.documentElement.style.setProperty('--nowis-public-header-height', `${Math.ceil(element.getBoundingClientRect().height)}px`);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      active = false; observer?.disconnect(); window.removeEventListener('resize', measure);
      document.documentElement.style.removeProperty('--nowis-public-header-height');
    };
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { setOpen(false); toggle.current?.focus(); } };
    const resize = () => { if (window.innerWidth >= 1200) setOpen(false); };
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', resize);
    return () => { document.removeEventListener('keydown', escape); window.removeEventListener('resize', resize); };
  }, [open]);
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');
  return <header className="nm-header" ref={header}>
    <nav className="nm-nav" aria-label="Navigation principale">
      <Link className="nm-brand" href="/" aria-label="Retour à l’accueil Création Nowis"><Image src="/nowis.png" width={44} height={44} alt="" /><span>NOWIS<small>Vos histoires en musique</small></span></Link>
      <div className="nm-desktop-nav">{primary.map(link => link.href === '/radio'
        ? <div className="ns-nav-radio" key={link.href}><Link href={link.href} aria-current={active(link.href) ? 'page' : undefined}>{link.label}</Link><ShareMenu compact /></div>
        : <Link key={link.href} href={link.href} aria-current={active(link.href) ? 'page' : undefined}>{link.label}</Link>)}<Link href="/connexion">Portail client</Link><Link className="cta-primary" href="/commander-une-chanson#demande">Créer ma chanson ↗</Link></div>
      <button className="nm-menu-toggle" ref={toggle} type="button" aria-expanded={open} aria-controls="mobile-main-menu" aria-label={open ? 'Fermer le menu principal' : 'Ouvrir le menu principal'} onClick={() => setOpen(!open)}>{open ? 'Fermer ×' : 'Menu ☰'}</button>
      {open && <div id="mobile-main-menu" className="nm-mobile-menu">
        <p className="nm-eyebrow">Bienvenue chez Nowis</p>
        {primary.map(link => link.href === '/radio'
          ? <div className="ns-nav-radio" key={link.href}><Link href={link.href} aria-current={active(link.href) ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}<span aria-hidden="true">↗</span></Link><ShareMenu /></div>
          : <Link key={link.href} href={link.href} aria-current={active(link.href) ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}<span aria-hidden="true">↗</span></Link>)}
        <div className="nm-menu-secondary">{[{label:'Accueil',href:'/'},{label:'Tarifs',href:'/tarifs'},{label:'Contact',href:'/contact'},{label:'Jeux',href:'/jeux'},{label:'À propos',href:'/a-propos'},{label:'Portail client',href:'/connexion'}].map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}</div>
        <Link className="cta-primary" href="/commander-une-chanson#demande" onClick={() => setOpen(false)}>Créer ma chanson ↗</Link>
      </div>}
    </nav>
    <VisitorCounters />
  </header>;
}
