import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaSpotify, FaYoutube } from 'react-icons/fa';
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
    <footer className="mt-20 border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
        <div className="flex flex-col gap-10 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Footer global
            </p>
            <h3 className="mt-3 text-3xl font-black text-white">Nowis Morin</h3>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Retrouve Nowis Morin sur ses plateformes officielles.
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Musique, vidéos et présence officielle regroupées dans un footer propre, professionnel et accessible sur tout le site.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
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
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-slate-200 transition duration-200 ${hoverClass}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h4 className="mb-4 text-white font-semibold">Navigation</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:max-w-md">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/musique" className="text-gray-400 hover:text-white transition-colors">
                  Musique
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gray-400 hover:text-white transition-colors">
                  Vidéos
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white transition-colors">
                  Services / Collaborations
                </Link>
              </li>
              <li>
                <Link href="/jeux" className="text-gray-400 hover:text-white transition-colors">
                  Jeux
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="text-gray-400 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                📧 <a href="mailto:simonmorin@nowis.store" className="hover:text-white transition-colors">simonmorin@nowis.store</a>
              </li>
              <li className="text-gray-400">
                📞 <a href="tel:+18193883407" className="hover:text-white transition-colors">(819) 388-3407</a>
              </li>
              <li>
                <Link href="/booking" className="text-gray-400 hover:text-white transition-colors">Réserver / parler de mon projet</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 space-y-3">
          <p className="text-center text-gray-500 text-sm">
            © {currentYear} Nowis Morin. Tous droits réservés.
          </p>
          <p className="text-center text-gray-500 text-xs">
            Conformité à la <Link href="/confidentialite" className="underline hover:text-gray-300">Loi 25</Link> sur la protection des renseignements personnels. Nous collectons le minimum nécessaire, sur consentement, et vous pouvez demander l’accès, la rectification ou la suppression de vos données.
          </p>
        </div>
      </div>
    </footer>
  );
};

