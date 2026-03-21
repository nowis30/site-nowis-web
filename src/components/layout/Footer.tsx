import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaSpotify, FaYoutube } from 'react-icons/fa';
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
    <footer className="mt-20 border-t border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.16),_transparent_24%),radial-gradient(circle_at_80%_8%,_rgba(139,92,246,0.16),_transparent_20%),linear-gradient(180deg,#050816_0%,#0b1220_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
        <div className="flex flex-col gap-10 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-200">
              Création Nowis
            </p>
            <h3 className="brand-metal-text mt-3 font-display text-4xl leading-none md:text-5xl">Nowis Morin</h3>
            <p className="mt-3 text-base leading-8 text-slate-200">
              Musique, créations visuelles et prise de contact réunies dans un footer plus sobre, lisible et direct.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">
              Retrouve-moi sur mes plateformes officielles
            </p>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 lg:justify-end">
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
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-slate-100 transition duration-200 ${hoverClass}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1fr_0.9fr_0.9fr]">
          <div>
            <h4 className="mb-4 font-semibold text-white">Navigation</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:max-w-md">
              <li>
                <Link href="/" className="text-slate-300 hover:text-primary-100 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/commander-une-chanson" className="text-slate-300 hover:text-primary-100 transition-colors">
                  Commander une chanson
                </Link>
              </li>
              <li>
                <Link href="/artistes" className="text-slate-300 hover:text-primary-100 transition-colors">
                  Artistes
                </Link>
              </li>
              <li>
                <Link href="/musique" className="text-slate-300 hover:text-primary-100 transition-colors">
                  Musique / exemples
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-300 hover:text-primary-100 transition-colors">
                  Services / Collaborations
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-slate-300 hover:text-primary-100 transition-colors">
                  Vidéos IA
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="text-slate-300 hover:text-primary-100 transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <ContactPrefillLink href={legalLinks.contact} className="text-slate-300 hover:text-primary-100 transition-colors">
                  Contact
                </ContactPrefillLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-300">
                📧 <a href={`mailto:${legalConfig.contactEmail}`} className="hover:text-primary-100 transition-colors">{legalConfig.contactEmail}</a>
              </li>
              <li className="text-slate-300">
                📞 <a href={legalConfig.contactPhoneHref} className="hover:text-primary-100 transition-colors">{legalConfig.contactPhone}</a>
              </li>
              <li>
                <ContactPrefillLink href={legalLinks.contact} className="text-slate-300 hover:text-primary-100 transition-colors">Parler de mon projet</ContactPrefillLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white font-semibold">Informations légales</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={legalLinks.legal} className="text-slate-300 hover:text-primary-100 transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href={legalLinks.privacy} className="text-slate-300 hover:text-primary-100 transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href={legalLinks.terms} className="text-slate-300 hover:text-primary-100 transition-colors">
                  Conditions de vente
                </Link>
              </li>
              <li className="text-slate-400 leading-6">
                {legalConfig.responsiblePrivacyTitle} : {legalConfig.responsiblePrivacyName}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 space-y-3">
          <p className="text-center text-slate-400 text-sm">
            © {currentYear} Nowis Morin. Tous droits réservés.
          </p>
          <p className="text-center text-slate-500 text-xs leading-6">
            <Link href={legalLinks.privacy} className="underline hover:text-primary-100">Politique de confidentialité</Link>
            {' '}et{' '}
            <Link href={legalLinks.terms} className="underline hover:text-primary-100">conditions de vente</Link>
            {' '}accessibles en tout temps depuis le site public. Conformité vie privée présentée de façon claire et discrète.
          </p>
        </div>
      </div>
    </footer>
  );
};

