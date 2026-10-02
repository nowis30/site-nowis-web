import Image from 'next/image';
import Link from 'next/link';
import { AlbumListenButton, AlbumPlayer } from '@/components/music/AlbumPlayer';
import { ShareMenu } from '@/components/radio/ShareMenu';
import { albumPlatforms, albumRelease, announcedDistribution, artistPlatforms, nounoursTrack } from '@/data/album';
import { buildMetadata } from '@/lib/seo';
import './album.css';

const description = 'L’amour de Nowis : le nouvel album de Nowis Morin, créé par Simon Morin avec l’intelligence artificielle. Écoutez les 32 chansons et découvrez Le gros nounours.';
const albumShareDestinations = [{
  id: 'album', label: 'l’album', title: `${albumRelease.title} · ${albumRelease.artist}`,
  url: `https://nowis.store${albumRelease.path}`,
  text: `Découvre ${albumRelease.title} de ${albumRelease.artist} : 32 chansons, dont Le gros nounours.`,
}] as const;

export const metadata = buildMetadata({
  title: 'L’amour de Nowis · Nouvel album de Nowis Morin', description,
  path: albumRelease.path, image: albumRelease.cover,
  keywords: ['L’amour de Nowis', 'Nowis Morin', 'Simon Morin', 'Le gros nounours', 'album musique IA'],
});

export default function AlbumPage() {
  return <article className="na-page">
    <header className="na-hero">
      <div className="na-hero-inner">
        <figure className="na-cover"><Image src={albumRelease.cover} alt="Pochette officielle de l’album L’amour de Nowis de Nowis Morin" width={1200} height={1200} sizes="(max-width: 700px) 88vw, (max-width: 1100px) 42vw, 490px" priority /><figcaption>Nowis Morin · Le nouvel album</figcaption></figure>
        <div className="na-hero-copy"><p className="na-eyebrow">Nouvel album · 32 chansons</p><h1>L’amour<br /><em>de Nowis.</em></h1>
          <p className="na-artist">Nowis Morin</p><p className="na-hero-intro">Des gens qu’on aime. Des souvenirs qui restent.<br />Et toute une vie à chanter.</p>
          <div className="na-hero-actions"><AlbumListenButton /><a className="na-button na-button-outline" href={albumRelease.spotifyUrl} target="_blank" rel="noopener noreferrer">Écouter sur Spotify <span aria-hidden="true">↗</span></a><ShareMenu destinations={albumShareDestinations} triggerLabel="Partager avec mes amis" triggerClassName="na-button na-button-outline" /></div>
          <p className="na-release-date">Sorti le <time dateTime={albumRelease.releasedAt}>{albumRelease.releaseDateLabel}</time></p>
        </div>
      </div>
    </header>

    <div className="na-content">
      <section className="na-highlight" aria-labelledby="nounours-title">
        <div><p className="na-eyebrow">Le titre à découvrir</p><h2 id="nounours-title">Le gros nounours.</h2><p>Une chanson à faire découvrir, un refrain à partager. Retrouvez-la au deuxième titre de l’album.</p></div>
        <div className="na-highlight-actions"><AlbumListenButton nounours /><a href={nounoursTrack.spotifyUrl} target="_blank" rel="noopener noreferrer">Ce titre sur Spotify <span aria-hidden="true">↗</span></a></div>
      </section>

      <AlbumPlayer />

      <section className="na-platforms" id="plateformes" aria-labelledby="platforms-title">
        <div className="na-section-heading"><div><p className="na-eyebrow">À écouter. À garder. À partager.</p><h2 id="platforms-title">Choisissez votre façon<br /><em>d’encourager l’artiste.</em></h2></div><p>Écoutez sur votre plateforme préférée, ou achetez l’album pour soutenir ma création musicale.</p></div>
        <div className="na-platform-grid">
          {albumPlatforms.map(platform => {
            const isPurchase = platform.action === 'purchase';
            const label = isPurchase ? 'SOUTENIR' : platform.action === 'regional' ? 'DÉCOUVRIR' : 'ÉCOUTER';
            const caption = isPurchase ? 'Acheter l’album' : platform.action === 'regional' ? 'Selon votre pays' : 'L’album complet';
            return <a key={platform.name} className={`na-platform-card${isPurchase ? ' na-platform-purchase' : ''}`} href={platform.url} target="_blank" rel="noopener noreferrer"><span className="na-platform-label">{label}</span><strong>{platform.name}</strong><span>{caption} <span aria-hidden="true">↗</span></span></a>;
          })}
        </div>
        <p className="na-platform-note">Les abonnements et achats se font directement sur les plateformes. Vous pouvez aussi acheter chaque titre avec les liens de la liste ci-dessus.</p>
        <p className="na-platform-note">Sur Anghami, la disponibilité varie selon le pays; l’écoute de cet album n’est actuellement pas proposée au Canada.</p>
        <div className="na-artist-platforms"><h3>Retrouvez aussi mon profil artiste</h3><div>{artistPlatforms.map(platform => <a key={platform.name} href={platform.url} target="_blank" rel="noopener noreferrer">{platform.name}<span>Voir le profil <span aria-hidden="true">↗</span></span></a>)}</div><p>Ces liens ouvrent mon catalogue. Le nouvel album peut encore être en cours d’ajout.</p></div>
        <details className="na-distribution"><summary>Les autres services de diffusion</summary><p>L’album a aussi été envoyé aux services suivants. Pour ces services, aucun lien public de cet album n’a encore été confirmé.</p><ul>{announcedDistribution.map(name => <li key={name}>{name}</li>)}</ul></details>
      </section>

      <section className="na-creator" aria-labelledby="creator-title">
        <div><p className="na-eyebrow">Derrière les chansons</p><h2 id="creator-title">Simon Morin.<br /><em>Vous me connaissez aussi comme Nowis.</em></h2></div>
        <div><p>Je suis Simon Morin, alias <strong>Nowis Morin</strong>. Je crée et partage mes chansons sur Internet avec l’aide de l’intelligence artificielle.</p><p>Avec <em>L’amour de Nowis</em>, je vous invite dans mon univers : l’amour, la famille, les souvenirs et la liberté.</p><Link href="/comment-je-cree">Découvrir ma façon de créer <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="na-radio-invite" aria-label="Continuer la découverte"><div><p className="na-eyebrow">Encore une chanson ?</p><h2>Mon univers continue<br /><em>sur Radio Nowis.</em></h2><p>Retrouvez toutes mes chansons et versions en lecture continue.</p></div><Link className="na-button na-button-dark" href="/radio">Découvrir la radio <span aria-hidden="true">↗</span></Link></section>
    </div>
  </article>;
}
