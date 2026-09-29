'use client';
import Link from 'next/link';
import { RadioControls, useRadio } from '@/components/radio/RadioProvider';
export function NowisRadio() { return <NowisRadioPanel />; }
export function NowisRadioPanel({ compact = false }: { compact?: boolean }) {
 const radio = useRadio();
 return <section className="nr-compact" aria-label="Radio Nowis dans les jeux"><h2>Radio Nowis</h2><p>{radio.track?.title ?? '141 chansons en lecture aléatoire, pour accompagner votre partie.'}</p><RadioControls compact={compact} /><p><Link href="/radio">Découvrir la radio ↗</Link></p></section>;
}
