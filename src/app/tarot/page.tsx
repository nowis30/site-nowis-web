import { buildMetadata } from '@/lib/seo';
import { TarotReader } from '@/components/tarot/TarotReader';
import { ShareMenu } from '@/components/radio/ShareMenu';

const tarotDestinations = [{
  id: 'tarot',
  label: 'la page Tarot',
  title: 'Clair de cartes · Tarot NOWIS',
  url: 'https://nowis.store/tarot',
  text: 'Découvrez Clair de cartes : tirez les cartes du Tarot de Marseille et explorez leur sens autour de votre question.',
}] as const;

export const metadata = buildMetadata({
  title: 'Clair de cartes · Liseuse de tarot',
  description: 'Tirez les 78 cartes du Tarot de Marseille et explorez une lecture symbolique liée à votre question, à chaque carte et à sa position. Un questionnaire facultatif permet de préciser votre situation.',
  path: '/tarot',
});

export default function TarotPage() {
  return (
    <section aria-label="Clair de cartes · Liseuse de tarot" className="mx-auto w-full max-w-[1320px]">
      <div className="flex justify-end px-6 pb-2 md:px-11">
        <ShareMenu destinations={tarotDestinations} triggerLabel="Partager la page Tarot" />
      </div>
      <TarotReader />
    </section>
  );
}
