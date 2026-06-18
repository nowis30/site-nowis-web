import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaSpotify, FaYoutube } from 'react-icons/fa';
import { TrackedPhoneLink } from '@/components/analytics/TrackedPhoneLink';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { legalConfig, legalLinks } from '@/data/legal';
import { socialLinks } from '@/config/socialLinks';

const footerPlatforms = [
  {
    key: 'youtube',
    label: 'YouTube officiel de Nowis Morin',
    icon: FaYoutube,
    hoverClass: 'hover:border-red-500/60 hover:text-red-400 hover:bg-red-500/10',
  },
  {
    key: 'spotify',
    label: 'Spotify officiel de Nowis Morin',
    icon: FaSpotify,
    hoverClass: 'hover:border-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10',
  },
  {
    key: 'instagram',
    label: 'Instagram officiel de Nowis Morin',
    icon: FaInstagram,
    hoverClass: 'hover:border-fuchsia-500/60 hover:text-fuchsia-400 hover:bg-fuchsia-500/10',
  },
  {
    key: 'facebook',
    label: 'Facebook officiel de Nowis Morin',
    icon: FaFacebookF,
    hoverClass: 'hover:border-sky-500/60 hover:text-sky-400 hover:bg-sky-500/10',
  },
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-[rgba(131,97,67,0.12)] bg-[radial-gradient(circle_at_top_left,_rgba(184,111,61,0.18),_transparent_22%),radial-gradient(circle_at_82%_10%,_rgba(203,165,120,0.22),_transparent_18%),linear-gradient(180deg,#f6f1ea_0%,#efe3d2_100%)] text-[color:var(--site-text)]">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
        <div className="warm-cta-panel flex flex-col gap-8 rounded-[2rem] p-7 md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">
              Création Nowis · Projet vivant
            </p>
            <h3 className="brand-metal-text mt-3 font-display text-4xl leading-none md:text-5xl">Musique, émotion et IA rendue simple</h3>
            <p className="mt-3 text-base leading-8 text-[color:var(--site-muted)]">
              Ateliers de création musicale, chansons personnalisées et projets créatifs pensés pour créer un vrai lien humain. Nowis Morin accompagne chaque demande avec une présence réelle et une approche douce, actuelle et accessible.
            </p>
          </div>

          <div className="flex max-w-xl flex-col gap-4 lg:items-end">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-heading)]">
              Un projet, une idée, un groupe à faire vibrer ?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ContactPrefillLink href={legalLinks.contact} className="cta-primary px-6 py-3">
                Parler de mon projet
              </ContactPrefillLink>
              <Link href="/ateliers" className="cta-secondary px-6 py-3">
                Voir les ateliers
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 md:gap-4 lg:justify-end">
              {footerPlatforms.map(({ key, label, icon: Icon, hoverClass }) => {
                const url = socialLinks[key as keyof typeof socialLinks];
                if (!url) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(131,97,67,0.12)] bg-white/78 text-xl text-[color:var(--site-heading)] transition duration-200 ${hoverClass}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-10 md:grid-cols-2 lg:grid-cols-[1fr_0.9fr_0.9fr]">
          <div className="glass-panel-soft rounded-[1.75rem] p-6">
            <h4 className="mb-4 font-semibold text-[color:var(--site-heading)]">Navigation</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:max-w-md">
              <li>
                <Link href="/" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/ateliers" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Ateliers
                </Link>
              </li>
              <li>
                <Link href="/jeux" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Jeux
                </Link>
              </li>
              <li>
                <Link href="/commander-une-chanson" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Chansons personnalisées
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/autres-services" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Autres services
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/connexion" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Portail client
                </Link>
              </li>
              <li>
                <Link href="/inscription" className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Créer un compte
                </Link>
              </li>
            </ul>
          </div>

          <div className="glass-panel-soft rounded-[1.75rem] p-6">
            <h4 className="mb-4 font-semibold text-[color:var(--site-heading)]">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-[color:var(--site-muted)]">
                📧 <a href={`mailto:${legalConfig.contactEmail}`} className="transition-colors hover:text-[color:var(--site-accent-strong)]">{legalConfig.contactEmail}</a>
              </li>
              <li className="text-[color:var(--site-muted)]">
                📞 <TrackedPhoneLink href={legalConfig.contactPhoneHref} className="transition-colors hover:text-[color:var(--site-accent-strong)]">{legalConfig.contactPhone}</TrackedPhoneLink>
              </li>
              <li>
                <ContactPrefillLink href={legalLinks.contact} className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">Parler de mon projet</ContactPrefillLink>
              </li>
              <li className="pt-2">
                <Link href="/connexion" className="cta-secondary gap-2 rounded-lg px-4 py-2 text-sm text-[color:var(--site-accent-strong)]">
                  Portail client →
                </Link>
              </li>
            </ul>
          </div>

          <div className="glass-panel-soft rounded-[1.75rem] p-6">
            <h4 className="mb-4 font-semibold text-[color:var(--site-heading)]">Informations légales</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={legalLinks.legal} className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href={legalLinks.privacy} className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href={legalLinks.terms} className="text-[color:var(--site-muted)] transition-colors hover:text-[color:var(--site-accent-strong)]">
                  Conditions de vente
                </Link>
              </li>
              <li className="leading-6 text-[color:var(--site-soft)]">
                {legalConfig.responsiblePrivacyTitle} : {legalConfig.responsiblePrivacyName}
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 border-t border-[rgba(131,97,67,0.12)] pt-8">
          <p className="text-center text-sm text-[color:var(--site-soft)]">
            © {currentYear} Nowis Morin. Tous droits réservés.
          </p>
          <p className="text-center text-xs leading-6 text-[color:var(--site-soft)]">
            <Link href={legalLinks.privacy} className="underline hover:text-[color:var(--site-accent-strong)]">Politique de confidentialité</Link>
            {' '}et{' '}
            <Link href={legalLinks.terms} className="underline hover:text-[color:var(--site-accent-strong)]">conditions de vente</Link>
            {' '}accessibles en tout temps depuis le site public. Conformité vie privée présentée de façon claire et discrète.
          </p>
        </div>
      </div>
    </footer>
  );
};

