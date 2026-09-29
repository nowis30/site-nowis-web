import { PortfolioScreen } from '@/screens';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/portfolio',
  title: 'Portfolio - NOWIS',
  description: 'Découvrez nos créations et projets réalisés avec l\'IA.',
});

export default function PortfolioPage() {
  return <PortfolioScreen />;
}
