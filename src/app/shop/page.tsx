import { buildMetadata } from '@/lib/seo';
import { ShopScreen } from '@/screens/ShopScreen';

export const metadata = buildMetadata({
  path: '/shop',
  title: 'Boutique – Création NOWIS',
  description: 'Découvrez nos produits créés avec l\'IA. T-shirts, accessoires et plus encore disponibles sur Printify.',
});

export default function ShopPage() {
  return <ShopScreen />;
}
