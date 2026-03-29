import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';
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

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Contact"
        title="Parle-moi de ta chanson ou de ton projet créatif"
        description="Le site public reste une vitrine. Les nouvelles demandes se font maintenant uniquement depuis le portail client securise."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <ClientPortalRequestGate nextPath="/client/dashboard" />

        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Contact direct</h2>
            <p className="mt-4 text-slate-300">Pour une demande rapide, une collaboration ou une idée à clarifier :</p>
            <ul className="mt-6 space-y-3 text-slate-200">
              <li>Email: <a href={`mailto:${legalConfig.contactEmail}`} className="hover:underline">{legalConfig.contactEmail}</a></li>
              <li>Telephone: <a href={legalConfig.contactPhoneHref} className="hover:underline">{legalConfig.contactPhone}</a></li>
            </ul>
            <div className="mt-6 flex flex-col gap-3">
              <a href="/connexion?next=%2Fclient%2Fsong-requests%2Fnouveau" className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Se connecter pour une demande chanson
              </a>
              <a href="/connexion?next=%2Fclient%2Fworkshops%2Fnouveau" className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Se connecter pour une demande atelier
              </a>
            </div>
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
