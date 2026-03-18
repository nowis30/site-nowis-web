import { PageHero } from '@/components/marketing/PageHero';
import { ProjectAssistant } from '@/components/tools/ProjectAssistant';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Assistant projet | Création Nowis',
  description:
    'Clarifie ton idée avec l’assistant projet de Création Nowis et découvre la meilleure direction entre chanson personnalisée, vidéo, visuel ou concept interactif.',
  path: '/assistant-projet',
  keywords: ['assistant projet Nowis Morin', 'quel service choisir', 'projet créatif IA', 'site utile Nowis Morin'],
});

const useCases = [
  {
    title: 'Tu ne sais pas quel format choisir',
    description: 'L’assistant t’aide à distinguer rapidement si ton besoin se prête mieux à une chanson, une vidéo, un visuel ou une approche plus interactive.',
  },
  {
    title: 'Tu veux mieux formuler ton idée',
    description: 'En quelques réponses, tu obtiens une direction plus claire à transmettre ensuite dans le formulaire de contact.',
  },
  {
    title: 'Tu veux éviter une demande trop vague',
    description: 'Cette page sert à cadrer un projet de façon simple, crédible et utile avant de passer à une vraie discussion.',
  },
];

export default function AssistantProjetPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow="Assistant projet"
        title="Clarifie ton idée avant de passer à l’action"
        description="Cette page t’aide à repérer la bonne direction pour ton projet créatif. Ce n’est pas un faux assistant spectaculaire : c’est un outil simple pour mieux formuler ton besoin avant de contacter Création Nowis."
        primaryCta={{ label: 'Parler de mon projet', href: '/contact?projectType=autre&message=Bonjour, je veux discuter d’un projet créatif avec Création Nowis.' }}
        secondaryCta={{ label: 'Commander une chanson personnalisée', href: '/commander-une-chanson' }}
      />

      <section className="mx-auto max-w-7xl px-6 pt-16 md:pt-20">
        <div className="grid gap-6 md:grid-cols-3">
          {useCases.map((useCase) => (
            <article key={useCase.title} className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">{useCase.title}</h2>
              <p className="mt-4 leading-relaxed text-slate-600">{useCase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <ProjectAssistant />
    </div>
  );
}
