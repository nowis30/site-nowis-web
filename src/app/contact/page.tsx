import { ContactForm } from '@/components/ContactForm';
import { PageHero } from '@/components/marketing/PageHero';
import { socialLinks } from '@/config/socialLinks';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact — Nowis Morin | Projet musical, vidéo ou création personnalisée',
  description:
    'Contacte Nowis Morin pour une chanson personnalisée, une vidéo créative, un visuel ou une collaboration artistique assistée par intelligence artificielle.',
  path: '/contact',
  keywords: ['Contact Nowis Morin', 'projet créatif IA Québec', 'chanson personnalisée Québec'],
});

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Contact"
        title="Parle-moi de ton projet créatif"
        description="Tu veux une chanson, une vidéo, un concept visuel ou une collaboration plus ambitieuse? Décris-moi ton idée et je te répondrai avec une approche claire, humaine et adaptée à ton objectif."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <ContactForm />

        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Contact direct</h2>
            <p className="mt-4 text-slate-300">Pour une demande rapide, une collaboration ou une idée à clarifier :</p>
            <ul className="mt-6 space-y-3 text-slate-200">
              <li>📧 <a href="mailto:simonmorin@nowis.store" className="hover:underline">simonmorin@nowis.store</a></li>
              <li>📞 <a href="tel:+18193883407" className="hover:underline">(819) 388-3407</a></li>
            </ul>
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
