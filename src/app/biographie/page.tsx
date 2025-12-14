/**
 * Page Biographie - NOWIS Morin
 * Présentation personnelle et liens sociaux
 */

import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SocialLinks } from '@/components/ui/SocialLinks';

export const metadata: Metadata = {
  title: 'Biographie | NOWIS Morin – Chanteur, Guitariste, Créateur',
  description:
    'Découvrez l\'histoire de NOWIS Morin : chanteur, guitariste et auteur passionné par la musique et la création propulsée par l\'IA. Une vie d\'art, d\'émotion et de création.',
};

export default function BiographiePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-20">
          <div className="max-w-4xl mx-auto px-6">
            
            {/* Titre */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                NOWIS Morin
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 italic">
                Chanteur • Guitariste • Créateur
              </p>
              <div className="h-1 w-24 bg-gradient-to-r from-primary-600 to-secondary-500 mx-auto mt-6"></div>
            </div>

            {/* Contenu biographie */}
            <article className="bg-white rounded-3xl p-8 md:p-12 shadow-card border border-gray-100 space-y-6 text-gray-700 leading-relaxed">
              
              <section>
                <p>
                  NOWIS Morin, c'est l'histoire d'un gars qui a commencé la guitare à 15 ans… et qui n'a jamais vraiment arrêté, même quand la vie essayait de lui faire croire le contraire. Avant les algorithmes, avant les plateformes, avant les "stratégies de contenu", il y avait surtout une chose : la nécessité de chanter. De se vider le cœur. De mettre des mots sur ce qui pèse, sur ce qui brûle, sur ce qui fait rire aussi, parce que oui — parfois, l'humour, c'est juste une autre façon élégante de survivre.
                </p>
              </section>

              <section>
                <p>
                  Chanteur avant tout, guitariste par réflexe, auteur par besoin, NOWIS écrit comme on respire quand l'air manque. Ses chansons sont des pages arrachées d'un carnet mental : souvenirs qui remontent, blessures qui cicatrisent, moments de lumière qui frappent sans avertir. Il raconte le passé sans le maquiller, le présent sans filtre, et le futur avec cette espèce de foi têtue qu'on garde quand on a déjà traversé des tempêtes.
                </p>
              </section>

              <section>
                <p>
                  Aujourd'hui, la musique de NOWIS Morin prend une nouvelle vitesse grâce à l'intelligence artificielle — pas pour remplacer l'âme, mais pour l'amplifier. L'IA devient un studio élargi, un partenaire de création, un accélérateur d'idées : des maquettes qui deviennent des chansons complètes, des textes qui se transforment en univers, des émotions brutes qui trouvent enfin leur forme finale. Il reste au centre de tout : la voix, l'intention, la vérité. La machine, elle, aide à peaufiner, à explorer, à produire plus loin et plus vite… mais le cœur du morceau, c'est toujours le sien.
                </p>
              </section>

              <section>
                <p>
                  Présent sur Spotify et sur les principales plateformes de diffusion, NOWIS Morin publie de plus en plus de titres qui ressemblent à un journal vivant — une discographie qui se construit morceau par morceau, comme on construit une vie : en essayant, en tombant, en se relevant, en créant. Chaque nouvelle sortie est un chapitre, parfois doux, parfois rugueux, mais toujours vrai.
                </p>
              </section>

              <section>
                <p>
                  Bienvenue dans l'univers de NOWIS Morin : un studio à ciel ouvert, une guitare comme boussole, une voix comme moteur… et une créativité qui ne demande qu'à prendre encore plus de place.
                </p>
              </section>

            </article>

            {/* Section Suivre */}
            <div className="text-center mt-20 space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Suivre NOWIS Morin
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Retrouvez les nouvelles sorties musicales, les coulisses créatifs et les projets en cours sur les réseaux.
                </p>
              </div>
              
              <SocialLinks className="mt-8" showLabel={true} />
            </div>

            {/* CTA retour */}
            <div className="text-center mt-16">
              <a
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour à l'accueil
              </a>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
