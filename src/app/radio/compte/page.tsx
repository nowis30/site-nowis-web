import { RadioAccount } from '@/components/radio/RadioAccount';
import { buildMetadata } from '@/lib/seo';
export const metadata = buildMetadata({ title: 'Mon compte Radio Nowis', description: 'Retrouvez vos chansons préférées de Radio Nowis.', path: '/radio/compte', noIndex: true });
export default function RadioAccountPage() { return <article className="nm-page"><RadioAccount /></article>; }
