import { buildMetadata } from '@/lib/seo';
import { TarotReader } from '@/components/tarot/TarotReader';
import { ShareMenu } from '@/components/radio/ShareMenu';

const tarotDestinations = [{
  id: 'tarot',
  label: 'la page Tarot',
  title: 'Oracle NOWIS · Tarot',
  url: 'https://nowis.store/tarot',
  text: 'Entrez dans l’univers de l’Oracle NOWIS : un rituel, les cartes du Tarot de Marseille et une vision symbolique autour de votre question.',
}] as const;

export const metadata = buildMetadata({
  title: 'Oracle NOWIS · Tarot et intuition',
  description: 'Un univers céleste, un rituel facultatif et les 78 cartes du Tarot de Marseille. Explorez une lecture liée à votre question et une vision IA sur demande, avec votre accord.',
  path: '/tarot',
});

export default function TarotPage() {
  return (
    <section aria-label="Oracle NOWIS · Tarot et intuition" className="mx-auto w-full max-w-[1320px]">
      <div className="flex justify-end px-6 pb-2 md:px-11">
        <ShareMenu destinations={tarotDestinations} triggerLabel="Partager la page Tarot" />
      </div>
      <TarotReader />
    </section>
  );
}
