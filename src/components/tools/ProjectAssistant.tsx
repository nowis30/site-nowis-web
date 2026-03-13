'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

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

const recommendationContent: Record<RecommendationKey, { title: string; description: string; contactHref: string }> = {
  song: {
    title: 'Chanson personnalisée',
    description: 'La meilleure direction pour ton idée est une chanson qui transforme une émotion, une histoire ou un moment important en création mémorable.',
    contactHref: '/contact?projectType=chanson&message=Je%20veux%20une%20chanson%20personnalisee.%20Voici%20mon%20objectif%20et%20le%20contexte%20de%20mon%20projet.',
  },
  video: {
    title: 'Vidéo promo IA',
    description: 'Une vidéo courte, claire et percutante sera le format le plus utile pour capter l’attention, présenter une offre ou vendre une idée.',
    contactHref: '/contact?projectType=video&message=Je%20veux%20une%20video%20promo%20IA.%20Voici%20ce%20que%20je%20veux%20montrer%20ou%20vendre.',
  },
  visual: {
    title: 'Visuel créatif',
    description: 'Un visuel bien dirigé est la meilleure porte d’entrée pour donner une image forte à ton projet, ton message ou ta présence en ligne.',
    contactHref: '/contact?projectType=autre&message=Je%20veux%20un%20visuel%20creatif.%20Voici%20le%20style%20et%20l%27objectif%20de%20mon%20projet.',
  },
  web: {
    title: 'Projet web / jeu / concept',
    description: 'Ton idée mérite une solution plus construite: page web, concept interactif, mini-jeu ou expérience numérique pensée pour présenter ou faire vivre ton projet.',
    contactHref: '/contact?projectType=autre&message=Je%20veux%20developper%20un%20projet%20web%20ou%20un%20concept%20interactif.%20Voici%20mon%20idee.',
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

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          {blocks.map((block, blockIndex) => (
            <div key={block.key} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {blockIndex + 1}
                </span>
                <h2 className="text-2xl font-bold text-slate-950">{block.title}</h2>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {block.options.map((option) => {
                  const isActive = answers[block.key] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [block.key]: option }))}
                      className={`rounded-2xl border px-5 py-4 text-left transition ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <span className="block text-base font-semibold">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Recommandation</p>
            {recommendation ? (
              <>
                <h2 className="mt-4 text-3xl font-bold">{recommendation.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">{recommendation.description}</p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
                  Cette suggestion part de tes réponses actuelles. Si tu veux aller plus loin, je peux t’aider à transformer cette direction en vrai projet clair et concret.
                </div>
                <Link
                  href={recommendation.contactHref}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Passer à l’action
                </Link>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-3xl font-bold">Commence par répondre aux 4 blocs</h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Dès que tes réponses sont complètes, l’assistant t’indique la meilleure direction entre chanson, vidéo, visuel ou projet web / jeu / concept.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
