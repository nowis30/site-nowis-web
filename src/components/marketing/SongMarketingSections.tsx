import Image from 'next/image';
import Link from 'next/link';
import { getAllSongs } from '@/data/songs';
import { songOccasions, songFaq } from '@/data/songMarketing';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';

export function SongOccasions() {
  return <section className="nm-section" id="occasions" aria-labelledby="occasions-title">
    <p className="nm-eyebrow">À chaque histoire, sa chanson</p>
    <h2 id="occasions-title">Quel moment voulez-vous offrir ?</h2>
    <p className="nm-intro">Pas besoin de trouver les mots parfaits. Commencez par ce qui compte pour vous.</p>
    <div className="nm-occasions">{songOccasions.map(item => <Link className="nm-occasion" key={item.id} href={`/commander-une-chanson?occasion=${item.id}#demande`}>
      <span className="nm-number" aria-hidden="true">{item.mark}</span><h3>{item.title}</h3><p>{item.note}</p><span className="nm-text-link">Raconter mon idée <span aria-hidden="true">↗</span></span>
    </Link>)}</div>
  </section>;
}

export async function SongExamples() {
  const songs = await getAllSongs();
  const ids = ['NajqUgYXvBc', 'YM-4eFn2ShE', 'aDAXQ3p4ezU'];
  const examples = ids.flatMap(id => { const song = songs.find(s => s.youtubeVideoId === id); return song ? [song] : []; });
  if (!examples.length) return null;
  return <section className="nm-section" id="exemples" aria-labelledby="examples-title">
    <div className="nm-section-top"><div><p className="nm-eyebrow">Prenez le temps d’écouter</p><h2 id="examples-title">Des émotions en musique.</h2></div><Link className="nm-text-link" href="/musique">Tout le catalogue ↗</Link></div>
    <p className="nm-intro">Quelques chansons publiées de Nowis pour découvrir son univers. Votre projet aura sa propre histoire.</p>
    <div className="nm-examples">{examples.map(song => <article className="nm-example" key={song.slug}>
      <Link href={`/chanson/${song.slug}`} className="nm-cover" aria-label={`Découvrir ${song.title}`}><Image src={song.image} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" /><span aria-hidden="true">↗</span></Link>
      <div className="nm-example-copy"><h3>{song.title}</h3><a className="nm-text-link" href={song.youtubeUrl} target="_blank" rel="noopener noreferrer">Écouter sur YouTube <span className="sr-only">{song.title} (nouvel onglet)</span> ↗</a></div>
    </article>)}</div>
    <p className="mt-5"><Link className="nm-text-link" href="/commander-une-chanson#demande">Et si la prochaine histoire était la vôtre ? →</Link></p>
  </section>;
}

export function SongProcess() {
  return <section className="nm-section nm-process" id="comment-ca-marche" aria-labelledby="process-title">
    <p className="nm-eyebrow">Simple, du premier mot à l’écoute</p><h2 id="process-title">Votre histoire donne le ton.</h2>
    <ol>{[
      ['Racontez', 'Une personne, quelques souvenirs, une occasion. Vous pouvez commencer avec une idée encore toute simple.'],
      ['Choisissez ensemble', 'Nowis précise avec vous l’ambiance, l’accompagnement, le prix et la date avant de lancer le projet.'],
      ['Offrez votre chanson', 'Recevez la création selon les modalités convenues et préparez votre moment d’écoute.'],
    ].map(([title, text], i) => <li key={title}><span className="nm-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
  </section>;
}

export function SongOffers() {
  return <section className="nm-section" id="formules" aria-labelledby="formules-title">
    <p className="nm-eyebrow">Un point de départ clair</p><h2 id="formules-title">Choisissez l’attention qui vous ressemble.</h2>
    <div className="nm-offers">
      <article><p className="nm-eyebrow">Le souvenir musical</p><h3>Chanson souvenir simple</h3><p className="nm-price">{formatPrice(REGULAR_PRICES.songs.memorySong)}</p><p>Une création à partir des informations que vous fournissez, pour un souvenir ou un moment amusant.</p><Link className="cta-secondary" href="/commander-une-chanson#demande">Parler de ma chanson</Link></article>
      <article className="nm-offer-featured"><p className="nm-eyebrow">Une histoire à approfondir</p><h3>Création accompagnée</h3><p className="nm-price nm-price-text">Sur soumission</p><p>Pour un texte à mettre en musique, des paroles à construire ensemble ou un projet qui demande davantage d’échanges.</p><Link className="cta-primary" href="/commander-une-chanson#demande">Raconter mon projet</Link></article>
      <article><p className="nm-eyebrow">Le souvenir à regarder</p><h3>Vidéo IA avec chanson</h3><p className="nm-price">{formatPrice(REGULAR_PRICES.songs.videoWithSong)}</p><p>Une formule simple qui associe une chanson et une création visuelle. Les projets vidéo plus élaborés sont sur soumission.</p><Link className="cta-secondary" href="/contact?projectType=video">Discuter de ma vidéo</Link></article>
    </div>
    <p className="nm-fine">Durée, format, ajustements et délai confirmés avant la commande. Taxes en sus si applicables. <Link href="/tarifs">Consulter tous les tarifs</Link>.</p>
  </section>;
}

export function SongFaq() {
  return <section className="nm-section nm-faq" aria-labelledby="faq-title"><div><p className="nm-eyebrow">Avant de vous lancer</p><h2 id="faq-title">Vos questions, simplement.</h2><Link className="nm-text-link" href="/contact">Une autre question ? Écrivez-moi ↗</Link></div><div>{songFaq.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>;
}

