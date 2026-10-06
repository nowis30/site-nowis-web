import { buildMetadata } from '@/lib/seo';
import { TarotReader } from '@/components/tarot/TarotReader';
import { ShareMenu } from '@/components/radio/ShareMenu';

const tarotDestinations = [{
  id: 'tarot',
  label: 'la page Tarot',
  title: 'Oracle NOWIS · Tarot, astrologie et numérologie',
  url: 'https://nowis.store/tarot',
  text: 'Explorez les tarots, votre carte du ciel, les nombres et vos relations avec l’Oracle NOWIS. Des lectures sourcées et symboliques, un avenir qui reste ouvert.',
}] as const;

export const metadata = buildMetadata({
  title: 'Oracle NOWIS · Tarot, astrologie et numérologie',
  description: 'Tarot de Marseille, Belline, carte du ciel, numérologie, relations et cycles lunaires : des lectures expliquées et sourcées, réunies dans une conclusion IA facultative. Vos choix restent libres.',
  path: '/tarot',
});

export default function TarotPage() {
  return (
    <section aria-label="Oracle NOWIS · Tarot et carte du ciel" className="mx-auto w-full max-w-[1320px]">
      <div className="flex justify-end px-6 pb-2 md:px-11">
        <ShareMenu destinations={tarotDestinations} triggerLabel="Partager la page Tarot" />
      </div>
      <TarotReader />
    </section>
  );
}
