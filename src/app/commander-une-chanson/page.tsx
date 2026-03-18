import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { PageHero } from '@/components/marketing/PageHero';
import {
  SongFinalCtaSection,
  SongGuaranteeBlock,
  SongPackagesSection,
  SongPortfolioBlock,
  SongProjectTypesSection,
  SongVideoExtrasSection,
  WhyNowisSection,
} from '@/components/marketing/SongSalesSections';
import { portfolioDisclosure, songSalesCtas } from '@/data/songSales';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Commander une chanson | Création Nowis',
  description:
    'Commande une chanson personnalisée avec Création Nowis : forfaits fixes, option vidéo IA, garantie satisfaction et demande simple à envoyer.',
  path: '/commander-une-chanson',
  keywords: ['Commander une chanson', 'chanson personnalisée Québec', 'forfaits chanson personnalisée', 'Création Nowis'],
});

export default function CommanderUneChansonPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow="Chanson personnalisée"
        title="Une chanson sur mesure à partir de votre histoire"
        description="Je crée des chansons personnalisées à partir de vos paroles, de vos souvenirs ou d’un moment important de votre vie."
        primaryCta={{ label: songSalesCtas.order.label, href: '#commande' }}
        secondaryCta={{ label: songSalesCtas.listen.label, href: songSalesCtas.listen.href }}
      />

      <SongProjectTypesSection />

      <SongPackagesSection showCardCta={false} />

      <SongVideoExtrasSection />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <WhyNowisSection />
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:py-20 lg:grid-cols-2">
        <SongGuaranteeBlock />
        <SongPortfolioBlock />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
        <SongFinalCtaSection />
      </section>

      <section id="commande" className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 lg:grid-cols-[1.05fr_0.95fr] md:pb-20">
        <div>
          <div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Commande</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950">Envoyer une demande claire et complète</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Décris l’histoire, l’émotion recherchée et le type de forfait voulu. Si tu hésites encore, tu peux simplement raconter le contexte avec tes mots.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Consentement portfolio</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{portfolioDisclosure.text}</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {portfolioDisclosure.options.map((option) => (
                  <li key={option} className="flex gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">•</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="#commande"
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Commander une chanson
            </Link>
            <Link
              href={songSalesCtas.talk.href}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {songSalesCtas.talk.label}
            </Link>
          </div>
        </div>

        <ContactForm
          initialProjectType="chanson"
          initialMessage="Bonjour, je veux commander une chanson personnalisée. Voici mon histoire, le contexte du projet et l’émotion que je veux transmettre."
          showPortfolioConsent
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">Besoin d’un peu d’aide avant d’envoyer la demande?</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Si tu veux mieux préparer ton message avant de commander, la page de préparation peut t’aider à clarifier le ton, les détails importants et les attentes du projet.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/avant-de-mecrire"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Bien préparer ma demande
            </Link>
            <Link
              href={songSalesCtas.listen.href}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {songSalesCtas.listen.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
