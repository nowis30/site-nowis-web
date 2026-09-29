import Link from 'next/link';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';

/** Uses the existing price source. Unconfirmed commercial terms stay explicit. */
export function OfferDetails({ type }: { type: 'chanson' | 'atelier' }) {
  return (
    <aside className="brand-card min-w-0 p-5 sm:p-8" aria-label="Tarif et détails à confirmer">
      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--site-accent-strong)]">Repères avant votre demande</p>
      {type === 'chanson' ? (
        <>
          <h2 className="mt-3 text-2xl font-bold">Chanson souvenir simple : {formatPrice(REGULAR_PRICES.songs.memorySong)}</h2>
          <p className="mt-4 leading-7 text-[color:var(--site-muted)]">Le tarif publié concerne une chanson amusante ou souvenir, créée à partir des informations fournies. Les accompagnements plus élaborés sont évalués sur demande.</p>
          <p className="mt-4 leading-7 text-[color:var(--site-muted)]">La durée de la chanson, le format du fichier, les révisions incluses et le délai de livraison restent à préciser dans la soumission. Ces détails ne sont pas encore fixés sur cette page.</p>
          <p className="mt-4 text-sm leading-6">Vidéo IA avec chanson, formule simple : {formatPrice(REGULAR_PRICES.songs.videoWithSong)}. Les projets spéciaux sont sur soumission.</p>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-2xl font-bold">Ateliers : deux durées, tarifs publiés</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/70 p-4 text-sm">
            <dt>1 h 30</dt><dd className="text-right font-bold">{formatPrice(REGULAR_PRICES.workshops.minutes90)}</dd>
            <dt>2 heures</dt><dd className="text-right font-bold">{formatPrice(REGULAR_PRICES.workshops.hours2)}</dd>
          </dl>
          <p className="mt-4 leading-7 text-[color:var(--site-muted)]">Les deux durées affichent actuellement le même montant. La formule adaptée, le nombre de participants inclus et les éventuels suppléments doivent être confirmés dans votre soumission.</p>
          <p className="mt-4 leading-7 text-[color:var(--site-muted)]">La formule à partir de {formatPrice(REGULAR_PRICES.groupFromPerPerson, ' / personne')} est une option distincte pour certaines activités de groupe. Le minimum de participants et les conditions d’accès restent à confirmer; elle ne remplace pas automatiquement le forfait atelier.</p>
          <p className="mt-4 text-sm leading-6">Animation, accompagnement créatif et dossier téléchargeable des compositions du groupe sont décrits dans la grille tarifaire.</p>
        </>
      )}
      <p className="mt-4 text-sm leading-6 text-[color:var(--site-muted)]">Taxes en sus si applicables. Le prix final est confirmé avant le début du mandat.</p>
      <Link href="/tarifs" className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Consulter tous les tarifs</Link>
    </aside>
  );
}
