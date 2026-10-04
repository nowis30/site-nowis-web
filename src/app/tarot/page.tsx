import { buildMetadata } from '@/lib/seo';
import { TarotReader } from '@/components/tarot/TarotReader';
import { ShareMenu } from '@/components/radio/ShareMenu';

const tarotDestinations = [{
  id: 'tarot',
  label: 'la page Tarot',
  title: 'Oracle NOWIS · Tarot et carte du ciel',
  url: 'https://nowis.store/tarot',
  text: 'Explorez votre carte du ciel, le rôle des quatre éléments et vos tirages de tarot avec l’Oracle NOWIS. Des pistes symboliques, un avenir qui reste ouvert.',
}] as const;

export const metadata = buildMetadata({
  title: 'Oracle NOWIS · Tarot et carte du ciel',
  description: 'Calculez votre carte du ciel avec votre naissance, comprenez les planètes et les quatre éléments, puis réunissez les transits et plusieurs tirages dans une conclusion IA facultative. Vos choix restent libres.',
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
