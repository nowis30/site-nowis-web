import { ContactForm } from '@/components/ContactForm';
import { PageHero } from '@/components/marketing/PageHero';
import { legalConfig, legalLinks } from '@/data/legal';
import { socialLinks } from '@/config/socialLinks';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact | Création Nowis',
  description:
    'Contacte Création Nowis pour commander une chanson personnalisée, demander une option vidéo IA ou discuter d’un projet créatif.',
  path: '/contact',
  keywords: ['Contact Création Nowis', 'commander une chanson Québec', 'projet créatif musique'],
});

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { name?: string; email?: string; projectType?: string; message?: string };
}) {
  const initialName = typeof searchParams?.name === 'string' ? searchParams.name : '';
  const initialEmail = typeof searchParams?.email === 'string' ? searchParams.email : '';
  const initialProjectType = typeof searchParams?.projectType === 'string' ? searchParams.projectType : '';
  const initialMessage = typeof searchParams?.message === 'string' ? searchParams.message : '';

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Contact"
        title="Parle-moi de ta chanson ou de ton projet créatif"
        description="La priorité reste la chanson personnalisée. Tu peux aussi me parler d’une option visuelle, d’une capsule vidéo IA ou d’un besoin créatif plus large."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <ContactForm
          initialName={initialName}
          initialEmail={initialEmail}
          initialProjectType={initialProjectType}
          initialMessage={initialMessage}
          showPortfolioConsent
        />

        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Contact direct</h2>
            <p className="mt-4 text-slate-300">Pour une demande rapide, une collaboration ou une idée à clarifier :</p>
            <ul className="mt-6 space-y-3 text-slate-200">
              <li>📧 <a href={`mailto:${legalConfig.contactEmail}`} className="hover:underline">{legalConfig.contactEmail}</a></li>
              <li>📞 <a href={legalConfig.contactPhoneHref} className="hover:underline">{legalConfig.contactPhone}</a></li>
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Protection des renseignements personnels</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Responsable : {legalConfig.responsiblePrivacyName}. Pour toute demande liée à l’accès, à la correction ou au retrait de renseignements personnels, tu peux écrire directement à cette personne.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={`mailto:${legalConfig.privacyEmail}`} className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
                {legalConfig.privacyEmail}
              </a>
              <a href={legalConfig.privacyPhoneHref} className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
                {legalConfig.privacyPhone}
              </a>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <a href={legalLinks.legal} className="text-sm font-semibold text-emerald-700 hover:underline">
                Voir les mentions légales
              </a>
              <a href={legalLinks.privacy} className="text-sm font-semibold text-emerald-700 hover:underline">
                Voir la politique de confidentialité
              </a>
              <a href={legalLinks.terms} className="text-sm font-semibold text-emerald-700 hover:underline">
                Voir les conditions de vente
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Où suivre Nowis Morin</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={socialLinks.spotify} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">Écouter sur Spotify</a>
              <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">Voir sur YouTube</a>
              <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">Instagram</a>
              <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">Facebook</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
