import Link from 'next/link';

// Public catalogue examples, not customer endorsements or unverified reviews.
const examples = [
  { title: 'Papa, mon ami', context: 'Une chanson écrite par Amélie Morin autour du lien avec son père.', href: '/chanson/papa-mon-ami', theme: 'Famille' },
  { title: '47 ans plus tard', context: 'Un texte de Jimmy Morin sur une histoire d’amour qui traverse les années.', href: '/chanson/47-ans-plus-tard', theme: 'Histoire de vie' },
  { title: 'La prochaine chanson pour toi', context: 'Une création de Nowis qui présente l’idée d’une chanson personnalisée.', href: '/chanson/la-prochaine-chanson-pour-toi', theme: 'Création personnalisée' },
];

export function PublishedExamples() {
  return (
    <section className="mt-10" aria-labelledby="published-examples-title">
      <h2 id="published-examples-title" className="text-3xl font-bold">Écoutez ce qu’une histoire peut devenir</h2>
      <p className="mt-3 max-w-3xl leading-7 text-[color:var(--site-muted)]">Trois créations du catalogue public pour découvrir des sujets et des intentions différentes.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {examples.map((example) => (
          <article key={example.href} className="brand-card flex flex-col p-6">
            <p className="text-sm font-semibold text-[color:var(--site-accent-strong)]">{example.theme}</p>
            <h3 className="mt-3 text-2xl font-bold">{example.title}</h3>
            <p className="mb-5 mt-3 flex-1 leading-7 text-[color:var(--site-muted)]">{example.context}</p>
            <Link href={example.href} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" aria-label={`Découvrir ${example.title}`}>Découvrir la chanson</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
