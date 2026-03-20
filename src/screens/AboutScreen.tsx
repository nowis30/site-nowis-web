/**
 * AboutScreen Component
 * Page à propos avec historique, équipe et valeurs.
 * ÉDITABLE: Raconte ton histoire, tes valeurs et ton équipe.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { SectionTitle } from '@/components/ui';

export const AboutScreen: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-20">
      {/* About Intro */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <SectionTitle title="Notre histoire" subtitle="D'où vient NOWIS" />
          {/* TODO: MODIFIER - Raconte ton histoire */}
          <p className="text-slate-300 mb-4">
            NOWIS est née d'une simple vision : démocratiser la création de contenu de qualité.
            Nous croyons que la créativité ne devrait pas être limitée par le coût ou les
            compétences techniques.
          </p>
          <p className="text-slate-300 mb-4">
            Aujourd'hui, avec les outils IA comme Suno, Revide.ai et les générateurs de design,
            n'importe qui peut créer du contenu professionnel. Notre mission est de t'aider à
            naviguer ces outils et à créer quelque chose d'extraordinaire.
          </p>
          <p className="text-slate-300">
            Que ce soit pour ton business, ton art ou simplement pour t'amuser, NOWIS est là
            pour transformer ton imagination en réalité.
          </p>
        </div>
        <div className="relative h-80 md:h-96 overflow-hidden rounded-lg bg-gradient-to-br from-green-600 to-green-800">
          {/* TODO: MODIFIER - Ajoute une image */}
          <Image
            src="/nowis.png"
            alt="Notre histoire"
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* Our Values */}
      <section>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Nos valeurs</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Value 1 */}
          <div className="bg-slate-800 p-8 rounded-lg text-center">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-4">Créativité</h3>
            {/* TODO: MODIFIER - Explique tes valeurs */}
            <p className="text-slate-400">
              Nous poussons les limites de ce qui est possible avec l'IA, créant des contenus
              uniques et inspirants qui se démarquent.
            </p>
          </div>

          {/* Value 2 */}
          <div className="bg-slate-800 p-8 rounded-lg text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-4">Efficacité</h3>
            <p className="text-slate-400">
              Nous optimisons le processus de création pour te livrer des résultats rapidement
              sans compromettre la qualité.
            </p>
          </div>

          {/* Value 3 */}
          <div className="bg-slate-800 p-8 rounded-lg text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-4">Collaboration</h3>
            <p className="text-slate-400">
              Ton succès est notre succès. Nous travaillons étroitement avec toi pour comprendre
              ta vision et la réaliser.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">L'équipe NOWIS</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* TODO: MODIFIER - Ajoute les membres de ton équipe */}
          {/* Team Member 1 */}
          <div className="bg-slate-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform">
            <div className="h-64 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-6xl">
              👤
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">Ton Nom</h3>
              <p className="text-green-400 text-sm mb-3">Fondateur & Lead Designer</p>
              <p className="text-slate-400 text-sm">
                Passionné par l'IA et la création de contenu innovant.
              </p>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="bg-slate-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform">
            <div className="h-64 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-6xl">
              👤
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">Nom du Membre</h3>
              <p className="text-green-400 text-sm mb-3">Music Producer (Suno)</p>
              <p className="text-slate-400 text-sm">
                Expert en composition musicale et audio design.
              </p>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="bg-slate-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform">
            <div className="h-64 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-6xl">
              👤
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">Nom du Membre</h3>
              <p className="text-green-400 text-sm mb-3">Video Director (Revide.ai)</p>
              <p className="text-slate-400 text-sm">
                Spécialiste des vidéos virales et du storytelling visuel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Contacte-nous</h2>
        <p className="text-lg mb-8">Prêt à lancer ton projet ? Parlons-en !</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <a href="mailto:simonmorin@nowis.store" className="flex items-center gap-2 text-lg font-semibold hover:underline">
            📧 simonmorin@nowis.store
          </a>
          <span className="hidden sm:block text-white/50">|</span>
          <a href="tel:+18193883407" className="flex items-center gap-2 text-lg font-semibold hover:underline">
            📞 (819) 388-3407
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-800 rounded-lg p-12">
        <h2 className="text-3xl font-bold text-center mb-12">Par les chiffres</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {/* Stat 1 */}
          <div>
            {/* TODO: MODIFIER - Ajoute tes statistiques */}
            <div className="text-4xl font-bold text-green-400 mb-2">200+</div>
            <p className="text-slate-400">Projets complétés</p>
          </div>

          {/* Stat 2 */}
          <div>
            <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
            <p className="text-slate-400">Clients satisfaits</p>
          </div>

          {/* Stat 3 */}
          <div>
            <div className="text-4xl font-bold text-green-400 mb-2">99%</div>
            <p className="text-slate-400">Satisfaction client</p>
          </div>

          {/* Stat 4 */}
          <div>
            <div className="text-4xl font-bold text-green-400 mb-2">24h</div>
            <p className="text-slate-400">Délai moyen</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-6">Prêt à créer avec nous ?</h2>
        <p className="text-lg text-slate-400 mb-8">
          Rejoins les centaines de créateurs qui ont déjà transformé leurs idées.
        </p>
        <a
          href="/booking"
          className="inline-block px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
        >
          Commencer maintenant
        </a>
      </section>
    </div>
  );
};
