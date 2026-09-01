'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type RecommendationKey = 'song' | 'video' | 'visual' | 'web';

type Answers = {
  objective: string;
  format: string;
  audience: string;
  level: string;
};

const questions = {
  objective: ['émouvoir', 'vendre', 'divertir', 'présenter un projet'],
  format: ['chanson', 'vidéo', 'visuel', 'site / jeu / concept'],
  audience: ['une personne', 'une famille', 'une entreprise', 'un projet spécial'],
  level: ['simple et rapide', 'plus poussé / plus ambitieux'],
} as const;

function buildContactHref(projectType: string, message: string) {
  return `/contact?projectType=${encodeURIComponent(projectType)}&message=${encodeURIComponent(message)}`;
}

const recommendationContent: Record<RecommendationKey, { title: string; description: string; contactHref: string }> = {
  song: {
    title: 'Chanson personnalisée',
    description:
      'La meilleure direction pour ton idée est une chanson qui transforme une émotion, une histoire ou un moment important en création mémorable.',
    contactHref: buildContactHref(
      'chanson',
      'Je veux une chanson personnalisée. Voici mon objectif et le contexte de mon projet.',
    ),
  },
  video: {
    title: 'Vidéo créative',
    description:
      'Une vidéo courte, claire et percutante sera le format le plus utile pour capter l’attention, présenter une offre ou mettre une idée en mouvement.',
    contactHref: buildContactHref(
      'video',
      'Je veux une vidéo créative. Voici ce que je veux montrer, raconter ou mettre en valeur.',
    ),
  },
  visual: {
    title: 'Visuel créatif',
    description:
      'Un visuel bien dirigé est la meilleure porte d’entrée pour donner une image forte à ton projet, ton message ou ta présence en ligne.',
    contactHref: buildContactHref(
      'autre',
      'Je veux un visuel créatif. Voici le style et l’objectif de mon projet.',
    ),
  },
  web: {
    title: 'Projet web / jeu / concept',
    description:
      'Ton idée mérite une solution plus construite : page web, concept interactif, mini-jeu ou expérience numérique pensée pour présenter ou faire vivre ton projet.',
    contactHref: buildContactHref(
      'autre',
      'Je veux développer un projet web ou un concept interactif. Voici mon idée.',
    ),
  },
};

const initialAnswers: Answers = {
  objective: '',
  format: '',
  audience: '',
  level: '',
};

function pickRecommendation(answers: Answers): RecommendationKey | null {
  if (!answers.objective || !answers.format || !answers.audience || !answers.level) {
    return null;
  }

  const scores: Record<RecommendationKey, number> = {
    song: 0,
    video: 0,
    visual: 0,
    web: 0,
  };

  if (answers.objective === 'émouvoir') {
    scores.song += 4;
    scores.visual += 1;
  }
  if (answers.objective === 'vendre') {
    scores.video += 3;
    scores.visual += 2;
    scores.web += 1;
  }
  if (answers.objective === 'divertir') {
    scores.web += 3;
    scores.video += 2;
    scores.song += 1;
  }
  if (answers.objective === 'présenter un projet') {
    scores.web += 4;
    scores.visual += 2;
    scores.video += 1;
  }

  if (answers.format === 'chanson') scores.song += 5;
  if (answers.format === 'vidéo') scores.video += 5;
  if (answers.format === 'visuel') scores.visual += 5;
  if (answers.format === 'site / jeu / concept') scores.web += 5;

  if (answers.audience === 'une personne' || answers.audience === 'une famille') {
    scores.song += 2;
    scores.visual += 1;
  }
  if (answers.audience === 'une entreprise') {
    scores.video += 2;
    scores.visual += 2;
    scores.web += 2;
  }
  if (answers.audience === 'un projet spécial') {
    scores.web += 2;
    scores.visual += 2;
    scores.song += 1;
    scores.video += 1;
  }

  if (answers.level === 'simple et rapide') {
    scores.song += 1;
    scores.video += 1;
    scores.visual += 2;
  }
  if (answers.level === 'plus poussé / plus ambitieux') {
    scores.web += 3;
    scores.video += 1;
    scores.song += 1;
  }

  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as RecommendationKey) ?? null;
}

export function ProjectAssistant() {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

  const recommendationKey = useMemo(() => pickRecommendation(answers), [answers]);
  const recommendation = recommendationKey ? recommendationContent[recommendationKey] : null;

  const blocks = [
    { key: 'objective' as const, title: 'Ton objectif', options: questions.objective },
    { key: 'format' as const, title: 'Le format que tu préfères', options: questions.format },
    { key: 'audience' as const, title: 'C’est pour', options: questions.audience },
    { key: 'level' as const, title: 'Niveau souhaité', options: questions.level },
  ];

  const completedCount = Object.values(answers).filter(Boolean).length;
  const remainingCount = blocks.length - completedCount;
  const hasAnswers = completedCount > 0;

  return (
    <section className="px-5 py-16 sm:px-6 md:py-20" aria-labelledby="assistant-questions-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">Ton projet en 4 réponses</p>
            <h2
              id="assistant-questions-title"
              className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl"
            >
              Fais ressortir la direction la plus naturelle
            </h2>
          </div>
          <p className="text-sm font-semibold text-[color:var(--site-soft)]" aria-live="polite">
            Progression : {completedCount} / {blocks.length}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            {blocks.map((block, blockIndex) => (
              <fieldset key={block.key} className="brand-card p-6 md:p-7">
                <legend className="w-full px-0">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-500/20 bg-primary-500/10 text-sm font-bold text-primary-300"
                    >
                      {blockIndex + 1}
                    </span>
                    <span className="font-display text-2xl text-[color:var(--site-heading)]">{block.title}</span>
                  </span>
                </legend>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {block.options.map((option) => {
                    const isActive = answers[block.key] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setAnswers((prev) => ({ ...prev, [block.key]: option }))}
                        className={`min-h-12 rounded-2xl border px-5 py-3.5 text-left font-semibold outline-none motion-safe:transition focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'border-primary-500/45 bg-primary-500/10 text-[color:var(--site-heading)] shadow-sm'
                            : 'border-[rgba(131,97,67,0.14)] bg-white/55 text-[color:var(--site-muted)] hover:border-primary-500/30 hover:bg-white/80'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{option}</span>
                          {isActive ? (
                            <span aria-hidden="true" className="text-primary-300">
                              ✓
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="warm-spotlight-panel p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="brand-chip inline-flex">Recommandation</span>
                {hasAnswers ? (
                  <button
                    type="button"
                    onClick={() => setAnswers(initialAnswers)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(131,97,67,0.18)] bg-white/55 px-4 py-2 text-sm font-semibold text-[color:var(--site-heading)] outline-none motion-safe:transition hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                  >
                    Recommencer
                  </button>
                ) : null}
              </div>

              <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
                {recommendation ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Direction suggérée</p>
                    <h3 className="mt-3 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">
                      {recommendation.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-[color:var(--site-muted)]">{recommendation.description}</p>
                    <div className="mt-6 rounded-2xl border border-emerald-700/15 bg-emerald-700/5 p-5 text-sm leading-6 text-[color:var(--site-muted)]">
                      Cette suggestion part de tes réponses actuelles. La discussion finale sert ensuite à préciser le style, le budget, les délais et le résultat attendu.
                    </div>
                    <Link href={recommendation.contactHref} className="cta-primary mt-7 w-full justify-center px-6 py-4 sm:w-auto">
                      Parler de ce projet
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-400">Encore {remainingCount} réponse{remainingCount > 1 ? 's' : ''}</p>
                    <h3 className="mt-3 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">
                      Réponds aux quatre blocs pour obtenir une direction
                    </h3>
                    <p className="mt-4 text-base leading-7 text-[color:var(--site-muted)]">
                      Tu peux modifier une réponse à tout moment. La recommandation apparaîtra automatiquement dès que les quatre choix seront complétés.
                    </p>
                    <Link
                      href={buildContactHref(
                        'autre',
                        'Bonjour, je veux discuter d’un projet créatif avec Création Nowis.',
                      )}
                      className="cta-secondary mt-7 w-full justify-center px-6 py-4 sm:w-auto"
                    >
                      Contacter Création Nowis maintenant
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
