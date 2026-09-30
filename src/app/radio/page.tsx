import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { RadioExperience } from '@/components/radio/RadioExperience';
import { SunoOffer } from '@/components/marketing/GuideElements';

export const metadata = buildMetadata({ title: 'Radio Nowis · Chansons, favoris et nouvel album', description: 'Écoutez les 139 chansons du profil Suno de Nowis en lecture aléatoire. Retrouvez L’amour de Nowis, gardez vos favoris et partagez vos coups de cœur.', path: '/radio' });

export default function RadioPage() {
  return <article className="nm-page"><header className="nm-section"><p className="nm-eyebrow">Radio Nowis · Vos histoires en musique</p><h1 className="nm-page-title">Un clic.<br /><em>La musique fait le reste.</em></h1><p className="nm-intro">Des chansons tendres, des refrains qui bougent, des essais qui surprennent. Entrez dans mon univers, une chanson à la fois.</p></header><RadioExperience /><section className="nm-final"><p className="nm-eyebrow">Et si la prochaine histoire était la vôtre ?</p><h2>Offrez une chanson<br />qui parle vraiment de vous.</h2><p>Un prénom, un souvenir, quelques mots à dire. Racontez-moi ce qui compte : on en fera une chanson personnalisée.</p><div className="nm-actions"><Link href="/commander-une-chanson#demande" className="cta-primary">Raconter mon idée ↗</Link><Link href="/musique" className="cta-secondary">Voir les nouveautés et favoris</Link></div></section><SunoOffer /></article>;
}
