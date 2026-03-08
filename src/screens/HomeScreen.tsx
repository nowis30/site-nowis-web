/**
 * HomeScreen Component - Création NOWIS
 * Page d'accueil vitrine orientée conversion.
 *
 * Structure :
 * 1. Hero principal
 * 2. Ce que je crée
 * 3. Comment ça fonctionne
 * 4. Portfolio / Exemples
 * 5. Idées de projets
 * 6. À propos
 * 7. Contact
 */

import React from 'react';
import { SectionTitle } from '@/components/ui';
import { ProjectCard } from '@/components/portfolio';
import { ContactForm } from '@/components/ContactForm';
import { TestimonialForm } from '@/components/TestimonialForm';
import { projects } from '@/data/projects';

const creations = [
  {
    title: 'Chansons personnalisées',
    description:
      'Des chansons créées à partir de votre histoire, de votre idée, de votre famille, de votre couple ou de votre projet.',
    icon: '🎵',
  },
  {
    title: 'Vidéos personnalisées',
    description:
      'Des vidéos créatives, amusantes ou promotionnelles générées avec l’intelligence artificielle selon votre concept.',
    icon: '🎬',
  },
  {
    title: 'Projets créatifs avec l’IA',
    description:
      'Des créations originales qui mélangent musique, visuels, humour et imagination pour produire quelque chose d’unique.',
    icon: '✨',
  },
];

const ideas = [
  'Chanson d’anniversaire',
  'Chanson pour couple',
  'Chanson familiale',
  'Vidéo amusante',
  'Vidéo promotionnelle',
  'Projet créatif original',
];

// Use the project list from src/data/projects.ts (slug + metadata)

export const HomeScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

        <div className="relative max-w-6xl mx-auto px-6 py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="h-24 w-24 overflow-hidden rounded-3xl border border-white/20 shadow-lg">
                  <img
                    src="/images/hero.jpg"
                    alt="Photo de moi"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
                    Création NOWIS
                  </p>
                  <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
                    Des chansons et vidéos personnalisées créées avec l’IA
                  </h1>
                  <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl">
                    Je transforme vos idées en créations originales, amusantes et uniques, pour offrir, surprendre ou donner vie à un projet.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/creations"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Voir mes créations
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-xl bg-green-500 px-8 py-4 text-base font-semibold text-white shadow-md transition hover:bg-green-600 hover:-translate-y-0.5"
                >
                  Proposer mon projet
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Musique IA & textes sur mesure
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Vidéos créatives & format réseaux
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Projets 100% personnalisés
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="relative h-72 w-72 overflow-hidden rounded-3xl border border-white/10 shadow-xl sm:h-80 sm:w-80">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/Ke6lWgFNJvQ?controls=1&rel=0&modestbranding=1"
                  title="Vidéo de présentation"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CE QUE JE CRÉE */}
      <section
        id="creations"
        className="relative max-w-7xl mx-auto px-6 py-20 scroll-mt-20"
      >
        <div className="text-center mb-14">
          <SectionTitle
            title="Ce que je crée"
            subtitle="Des créations sur mesure qui mêlent musique, vidéo et imagination."
            centered
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {creations.map((item) => (
            <div
              key={item.title}
              className="group rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                {item.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">{item.description}</p>
              <div className="mt-6">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  En savoir plus
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA FONCTIONNE */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 bg-slate-50">
        <div className="text-center mb-14">
          <SectionTitle
            title="Comment ça fonctionne"
            subtitle="Un processus simple, transparent et orienté résultat."
            centered
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Vous me racontez votre idée',
              description:
                'Un brief clair et vos inspirations suffisent. Je pose des questions pour comprendre votre vision.',
              icon: '🗣️',
            },
            {
              title: 'Je crée votre projet avec l’IA',
              description:
                'Je compose, monte et module jusqu’à obtenir une création fidèle à vos attentes.',
              icon: '⚡',
            },
            {
              title: 'Vous recevez votre création personnalisée',
              description:
                'Fichiers livrés prêts à l’usage. Ajustements possibles selon vos retours.',
              icon: '✅',
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PORTFOLIO / EXEMPLES */}
      <section
        id="portfolio"
        className="relative max-w-7xl mx-auto px-6 py-20 scroll-mt-20"
      >
        <div className="text-center mb-14">
          <SectionTitle
            title="Exemples de créations"
            subtitle="Des projets conçus pour inspirer."
            centered
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((item) => (
            <ProjectCard
              key={item.slug}
              title={item.title}
              description={item.description}
              fallbackEmoji="🎥"
              href={item.url}
              tags={item.tags}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Proposer mon projet
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 bg-slate-50">
        <div className="text-center mb-14">
          <SectionTitle
            title="Témoignages"
            subtitle="Les retours seront publiés ici dès qu’il y en aura."
            centered
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-12 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Envie de partager ton expérience ?</h3>
            <p className="text-gray-600 leading-relaxed">
              Cette section affichera bientôt les retours des clients. Pour l’instant, tu peux m’envoyer ton avis ici :
            </p>
            <ul className="mt-6 space-y-3 text-gray-600">
              <li>• Ce que tu as aimé</li>
              <li>• Ce que tu veux voir amélioré</li>
              <li>• Ce qui t’a surpris ou plu</li>
            </ul>
            <p className="mt-6 text-sm text-gray-500">
              Ton message m’aide à rendre les prochaines créations encore meilleures.
            </p>
          </div>

          <TestimonialForm />
        </div>
      </section>

      {/* IDEES DE PROJETS */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <SectionTitle
            title="Idées de projets"
            subtitle="Pour vous aider à imaginer ce que l’on peut créer ensemble."
            centered
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div
              key={idea}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{idea}</h3>
              <p className="text-gray-600">Une piste claire pour imaginer votre prochaine création.</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Proposer mon projet
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* A PROPOS */}
      <section
        id="about"
        className="relative max-w-7xl mx-auto px-6 py-20 scroll-mt-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">À propos</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Je m’appelle Simon Morin. Je crée des chansons, vidéos et projets créatifs avec l’aide de l’intelligence artificielle.
              Mon objectif est de transformer une idée simple en création originale, amusante et personnalisée.
            </p>
            <p className="text-base text-gray-600">
              Je prends le temps d’écouter vos envies, je propose des idées, et je livre un résultat unique qui vous ressemble.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary-600 text-white font-semibold rounded-xl hover:bg-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Discuter de mon projet
              <span aria-hidden>→</span>
            </a>
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            <img
              src="/hero.jpg"
              alt="Simon Morin - Création NOWIS"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="relative max-w-7xl mx-auto px-6 py-20 scroll-mt-20"
      >
        <div className="text-center mb-12">
          <SectionTitle
            title="Contact"
            subtitle="Parlez-moi de votre idée et je vous répondrai rapidement."
            centered
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ContactForm />

          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-green-600 to-slate-800 p-10 text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-3">Besoin d'aide pour démarrer ?</h3>
              <p className="text-gray-100">
                Raconte-moi ton idée en quelques lignes : quel message tu veux transmettre, quelle ambiance, et où tu veux partager ton projet.
              </p>
              <p className="mt-6 text-sm text-white/80">
                Je réponds généralement sous 24 h. Tes informations restent confidentielles.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-10 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Contact direct</h3>
              <ul className="space-y-3 text-gray-700">
                <li>
                  📧{' '}
                  <a
                    href="mailto:simonmorin@nowis.store"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    simonmorin@nowis.store
                  </a>
                </li>
                <li>
                  📞{' '}
                  <a
                    href="tel:+18193883407"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    (819) 388-3407
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
