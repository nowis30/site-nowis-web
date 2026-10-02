import { buildMetadata } from '@/lib/seo';
import { TarotReader } from '@/components/tarot/TarotReader';

export const metadata = buildMetadata({
  title: 'Clair de cartes · Liseuse de tarot',
  description: 'Tirez les 78 cartes du Tarot de Marseille et explorez une lecture symbolique liée à votre question, à chaque carte et à sa position. Un questionnaire facultatif permet de préciser votre situation.',
  path: '/tarot',
});

export default function TarotPage() {
  return (
    <section aria-label="Clair de cartes · Liseuse de tarot" className="mx-auto w-full max-w-[1320px]">
      <TarotReader />
    </section>
  );
}
