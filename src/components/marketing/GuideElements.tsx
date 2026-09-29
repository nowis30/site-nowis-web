import Link from 'next/link';
import { revidReferral } from '@/data/creationGuide';

export function CreationFlow() {
  return <ol className="ng-flow" aria-label="Les trois étapes de création"><li><span>01 · ChatGPT</span><strong>Les mots justes</strong><p>Votre histoire → paroles → réécritures</p></li><li><span>02 · Suno</span><strong>L’émotion en musique</strong><p>Paroles + style → écoutes → MP3</p></li><li><span>03 · Revid</span><strong>Un univers visuel</strong><p>MP3 + direction → montage → vidéo</p></li></ol>;
}

export function RevidOffer() {
  return <aside className="ng-offer" aria-labelledby="revid-offer-title"><p className="nm-eyebrow">Le lien partagé par Nowis</p><h3 id="revid-offer-title">Envie d’essayer Revid ?</h3><p>Code promo : <strong className="ng-code">{revidReferral.code}</strong></p><p>Ce code a été partagé dans mes descriptions YouTube avec une annonce de <strong>20 % de rabais</strong>. Vérifiez la réduction appliquée et les conditions affichées par Revid avant de payer : sa validité actuelle et les forfaits admissibles ne sont pas confirmés ici.</p><a href={revidReferral.url} target="_blank" rel="sponsored noopener noreferrer" className="cta-primary">Découvrir Revid avec mon lien ↗<span className="sr-only"> (nouvel onglet)</span></a><p className="nm-fine">Lien de recommandation avec suivi de parrainage. Revid est un service externe; votre abonnement se gère directement chez eux.</p></aside>;
}

export function GuideHelp() {
  return <section className="nm-final"><p className="nm-eyebrow">Créer vous-même, ou vous faire accompagner</p><h2>Votre histoire reste<br />le point de départ.</h2><p>Vous préférez me confier votre chanson ? Racontez-moi votre idée. Vous souhaitez apprendre en groupe ? Découvrez les ateliers.</p><div className="nm-actions"><Link className="cta-primary" href="/commander-une-chanson#demande">Me confier une chanson ↗</Link><Link className="cta-secondary" href="/ateliers">Apprendre en atelier</Link></div></section>;
}
