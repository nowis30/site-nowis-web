import Image from 'next/image';
import Link from 'next/link';
import { featuredAlbum, itunesUrl } from '@/lib/music-store';

export function FeaturedAlbum({ showTracks = false }: { showTracks?: boolean }) {
  return <section className="nm-section nr-album" id="nouvel-album" aria-labelledby="new-album-title">
    <div className="nr-album-main">
      <Link href="/album" aria-label="Découvrir et écouter L’amour de Nowis">
        <Image src={featuredAlbum.cover} alt="Pochette de L’amour de Nowis : Nowis Morin dans son univers musical" width={800} height={800} sizes="(max-width: 700px) 90vw, 360px" />
      </Link>
      <div><p className="nm-eyebrow">Le nouvel album · Nowis Morin</p><h2 id="new-album-title">L’amour<br /><em>de Nowis.</em></h2>
        <p className="nm-intro">32 chansons. L’amour, la famille, les souvenirs et la liberté, en musique.</p>
        <div className="nm-actions"><Link className="cta-primary" href="/album">Écouter et découvrir l’album ↗</Link><a className="cta-secondary" href={itunesUrl(featuredAlbum.url)} target="_blank" rel="noopener noreferrer">Acheter l’album sur iTunes ↗</a></div>
        <p className="nm-fine">Apple Music est aussi accessible sur Android. Les achats sont proposés dans l’iTunes Store.</p>
        <Link className="nm-text-link" href="/album#ecouter">Découvrir les 32 chansons ↗</Link>
      </div>
    </div>
    {showTracks && <details className="ng-details nr-album-tracks"><summary>Les 32 chansons de l’album · Achat à l’unité</summary><ol>{featuredAlbum.tracks.map(track => <li key={track.id}><span>{track.title}</span><a href={itunesUrl(track.url)} target="_blank" rel="noopener noreferrer" aria-label={`Acheter ${track.title} sur iTunes`}>iTunes ↗</a></li>)}</ol></details>}
  </section>;
}
