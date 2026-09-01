import { PageHero } from '@/components/marketing/PageHero';
import { ProjectAssistant } from '@/components/tools/ProjectAssistant';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

export const metadata = buildMetadata({
  title: 'Assistant projet | Création Nowis',
  description:
    'Clarifie ton idée avec l’assistant projet de Création Nowis et découvre la meilleure direction entre chanson personnalisée, vidéo, visuel ou concept interactif.',
  path: '/assistant-projet',
  keywords: ['assistant projet Nowis Morin', 'quel service choisir', 'projet créatif IA', 'site utile Nowis Morin'],
});

const useCases = [
  {
    title: 'Choisir le bon format',
    description:
      'Repère rapidement si ton idée se prête mieux à une chanson, une vidéo, un visuel ou une expérience numérique plus interactive.',
  },
  {
    title: 'Structurer ton idée',
    description:
      'Quatre réponses suffisent pour faire ressortir l’objectif, le public, le format et le niveau d’ambition du projet.',
  },
  {
    title: 'Arriver mieux préparé',
    description:
      'Tu obtiens une direction claire avant le formulaire de contact, ce qui rend la prochaine discussion plus simple et plus productive.',
  },
];

export default function AssistantProjetPage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Assistant projet"
        title="Clarifie ton idée avant de passer à l’action"
        description="Réponds à quatre questions simples pour identifier la direction la plus adaptée à ton projet. L’outil ne remplace pas une discussion : il t’aide à arriver avec une idée déjà bien cadrée."
        primaryCta={{
          label: 'Parler de mon projet',
          href: '/contact?projectType=autre&message=Bonjour%2C%20je%20veux%20discuter%20d%E2%80%99un%20projet%20cr%C3%A9atif%20avec%20Cr%C3%A9ation%20Nowis.',
        }}
        secondaryCta={{ label: 'Commander une chanson personnalisée', href: SONG_REQUEST_GOOGLE_AUTH_URL }}
      />

      <section className="section-soft px-5 py-14 sm:px-6 md:py-20" aria-labelledby="assistant-benefits-title">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Avant de commencer</p>
          <h2
            id="assistant-benefits-title"
            className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl"
          >
            Une courte réflexion qui fait gagner du temps ensuite
          </h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {useCases.map((useCase, index) => (
              <article
                key={useCase.title}
                className="brand-card p-6 motion-safe:transition-transform motion-safe:hover:-translate-y-1 md:p-7"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary-500/20 bg-primary-500/10 text-sm font-bold text-primary-300"
                >
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-2xl text-[color:var(--site-heading)]">{useCase.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">{useCase.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProjectAssistant />
    </main>
  );
}
