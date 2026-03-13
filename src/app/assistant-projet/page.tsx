import { PageHero } from '@/components/marketing/PageHero';
import { ProjectAssistant } from '@/components/tools/ProjectAssistant';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Assistant projet — Nowis Morin',
  description:
    'Réponds à quelques questions et découvre le service Nowis Morin le plus adapté à ton idée: chanson, vidéo, visuel ou projet web.',
  path: '/assistant-projet',
  keywords: ['assistant projet Nowis Morin', 'quel service choisir', 'projet créatif IA', 'site utile Nowis Morin'],
});

export default function AssistantProjetPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow="Assistant projet"
        title="Quel projet te convient le mieux?"
        description="Réponds à quelques questions et découvre la meilleure direction pour ton idée."
      />
      <ProjectAssistant />
    </div>
  );
}
