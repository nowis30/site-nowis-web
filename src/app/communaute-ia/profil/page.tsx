import { AiArtistProfileEditor } from '@/components/community/AiArtistProfileEditor';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Mon profil artiste | Communauté musique IA',
  description: 'Créez et modifiez votre profil artiste dans la communauté musicale IA Nowis.',
  path: '/communaute-ia/profil',
  noIndex: true,
});

export default function AiArtistProfilePage() {
  return <article className="nm-page"><AiArtistProfileEditor /></article>;
}
