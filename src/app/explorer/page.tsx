import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { rentalsPublicUrl } from '@/lib/rentals-url';
export const metadata = buildMetadata({title: 'Explorer l’univers Nowis', description: 'Retrouvez les chansons, ateliers, jeux, liseuse de tarot, créations, services et accès clients de Création Nowis.', path: '/explorer'});
const groups = [
  {title: 'Offrir & créer', links: [['Chansons personnalisées','/commander-une-chanson'],['Ateliers de groupe','/ateliers'],['Demander un atelier','/ateliers/demande'],['Services créatifs','/services'],['Tarifs','/tarifs'],['Préparer mon projet','/avant-de-mecrire'],['Assistant projet','/assistant-projet']]},
  {title: 'Apprendre à créer', links: [['Ma méthode de création','/comment-je-cree'],['Guide ChatGPT, Suno et Revid','/outils-creation-musicale']]},
  {title: 'Écouter & découvrir', links: [['Radio Nowis','/radio'],['Musique : nouveautés et favoris','/musique'],['Vidéos','/videos'],['Créations','/creations'],['Portfolio','/portfolio'],['Artistes','/artistes'],['Idées','/idees'],['Jeux','/jeux'],['Liseuse de tarot','/tarot'],['Boutique','/shop']]},
  {title: 'Rencontrer & échanger', links: [['À propos de Nowis','/a-propos'],['Biographie','/biographie'],['Contact','/contact'],['Autres services','/autres-services'],['Prendre rendez-vous','/booking']]},
  {title: 'Retrouver mon projet', links: [['Portail client','/connexion'],['Créer un compte','/inscription'],['Confidentialité','/confidentialite'],['Conditions de vente','/conditions-de-vente'],['Mentions légales','/mentions-legales']]},
];
export default function ExplorerPage() {
  return <div className="nm-page"><section className="nm-section"><p className="nm-eyebrow">Toutes les portes restent ouvertes</p><h1 className="nm-page-title">Explorez à votre rythme.</h1><p className="nm-intro">Une envie de musique, un projet de groupe, un jeu ou un dossier à retrouver : choisissez votre chemin.</p></section><div className="nm-explorer">{groups.map(group => <section key={group.title}><h2>{group.title}</h2><ul>{group.links.map(([label,href]) => <li key={href}><Link href={href}>{label}<span aria-hidden="true">↗</span></Link></li>)}</ul></section>)}</div><section className="nm-section nm-discover"><div><h2>Vous cherchez un logement ?</h2><p>Les annonces et les demandes de visite sont accessibles sur le site de location.</p></div><a className="cta-secondary" href={rentalsPublicUrl} target="_blank" rel="noopener noreferrer">Logements à louer ↗<span className="sr-only"> (nouvel onglet)</span></a></section></div>;
}

