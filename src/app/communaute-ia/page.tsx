import { AiMusicCommunity } from '@/components/community/AiMusicCommunity';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Communauté musique IA | Partagez vos créations',
  description: 'Partagez une chanson créée avec Suno, Udio ou un autre outil d’intelligence artificielle et découvrez les créations musicales de la communauté Nowis.',
  path: '/communaute-ia',
  keywords: ['musique IA', 'chanson IA', 'Suno', 'Udio', 'partage musique IA', 'Création Nowis'],
});

export default function AiMusicCommunityPage() {
  return (
    <article className="nm-page">
      <header className="nm-section">
        <p className="nm-eyebrow">Communauté · Musique créée avec l’IA</p>
        <h1 className="nm-page-title">
          Faites écouter<br />
          <em>ce que vous avez créé.</em>
        </h1>
        <p className="nm-intro">
          Vous créez de la musique avec Suno, Udio ou un autre outil d’IA ? Publiez votre chanson ici,
          découvrez celles des autres créateurs et faites circuler les bonnes trouvailles.
        </p>
      </header>

      <AiMusicCommunity />
    </article>
  );
}
