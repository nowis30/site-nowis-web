import Link from 'next/link';
import { FeaturedAlbum } from '@/components/marketing/FeaturedAlbum';
import { HeroVideoPlaceholder } from '@/components/marketing/HeroVideoPlaceholder';
import { HomeMusicSelections } from '@/components/marketing/HomeMusicSelections';
import { SongExamples, SongFaq, SongOccasions, SongOffers, SongProcess } from '@/components/marketing/SongMarketingSections';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';

export function HomeScreen() {
  return <div className="nm-page">
    <section className="nm-hero" aria-labelledby="home-title">
      <div><p className="nm-eyebrow">Chansons personnalisées · Création Nowis</p>
        <h1 id="home-title">Il y a des histoires<br />qui méritent<br /><em>leur chanson.</em></h1>
        <p className="nm-hero-text">Un amour, un merci, un souvenir. Transformez ce qui vous touche en une chanson à offrir, avec l’accompagnement de Nowis Morin et la création musicale assistée par IA.</p>
        <div className="nm-actions"><Link className="cta-primary" href="/commander-une-chanson">Créer ma chanson ↗</Link><a className="cta-secondary" href="#exemples">Écouter des exemples</a></div>
        <p className="nm-fine">Première demande sans compte ni paiement.</p>
      </div>
      <div className="nm-gift" aria-label="Une chanson créée à partir de votre histoire">
        <p className="nm-eyebrow">Le cadeau, c’est votre histoire.</p>
        <div className="nm-record" aria-hidden="true"><span>NOWIS<br /><small>VOTRE HISTOIRE<br />EN MUSIQUE</small></span></div>
        <p className="nm-gift-title">Pour une personne.<br />Pour un vrai moment.</p>
        <div className="nm-gift-bottom"><span>Création numérique</span><span>À offrir, à réécouter</span></div>
      </div>
    </section>
    <div className="nm-reassurance"><span>Un échange avec Nowis</span><span>Chanson souvenir simple : {formatPrice(REGULAR_PRICES.songs.memorySong)}</span><span>Prix confirmé avant création</span></div>
    <SongOccasions />
    <SongExamples />
    <SongProcess />
    <SongOffers />
    <section className="nm-section nm-about" aria-labelledby="about-nowis"><div><p className="nm-eyebrow">La personne derrière la création</p><h2 id="about-nowis">Moi, c’est Nowis.</h2><p className="nm-intro">Je vous accompagne pour donner une direction musicale à vos souvenirs et à vos idées. Vous apportez votre histoire; nous précisons ensemble ce que la chanson doit raconter.</p><Link className="nm-text-link" href="/a-propos">Découvrir mon parcours ↗</Link><br /><Link className="nm-text-link" href="/comment-je-cree">Comment je crée mes chansons ↗</Link></div><div className="nowis-home-video"><HeroVideoPlaceholder videoUrl="/videos/nowis-presentation-web.mp4" /></div></section>
    <FeaturedAlbum />
    <HomeMusicSelections /><div className="nm-actions nr-invite"><Link href="/radio" className="cta-secondary">Radio Nowis · 139 chansons en aléatoire ↗</Link></div>
    <SongFaq />
    <section className="nm-final"><p className="nm-eyebrow">Quelques mots pour commencer</p><h2>À qui pensez-vous<br />en lisant cette page ?</h2><p>Racontez-moi cette personne et le moment que vous aimeriez souligner.</p><Link className="cta-primary" href="/commander-une-chanson#demande">Raconter mon idée ↗</Link></section>
    <section className="nm-section nm-discover" aria-labelledby="discover-title"><div><p className="nm-eyebrow">Et si vous créiez ensemble ?</p><h2 id="discover-title">L’univers Nowis continue.</h2><p>Ateliers de groupe, vidéos, jeux et autres projets : retrouvez toutes les portes d’entrée.</p></div><div><Link className="cta-secondary" href="/ateliers">Découvrir les ateliers</Link><Link className="nm-text-link" href="/explorer">Explorer tout le site ↗</Link></div></section>
  </div>;
}
