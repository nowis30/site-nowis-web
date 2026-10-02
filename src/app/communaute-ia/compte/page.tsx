import { AiCommunityAccount } from '@/components/community/AiCommunityAccount';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Compte artiste | Communauté musique IA',
  description: 'Créez votre compte artiste ou connectez-vous à la communauté musicale IA de Nowis.',
  path: '/communaute-ia/compte',
  noIndex: true,
});

export default function AiCommunityAccountPage() {
  return <article className="nm-page"><AiCommunityAccount /></article>;
}
