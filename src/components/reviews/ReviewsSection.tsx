import { prisma } from '@/lib/prisma';

export async function ReviewsSection() {
  const reviews = await prisma.review.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      rating: true,
      comment: true,
      context: true,
      createdAt: true,
    },
  });

  if (reviews.length === 0) {
    return (
      <div className="glass-panel-soft rounded-[2rem] border border-[rgba(131,97,67,0.12)] p-8 text-center">
        <div className="text-4xl" aria-hidden="true">💬</div>
        <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)]">Aucun commentaire publié pour le moment</h3>
        <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
          Soyez la première personne à laisser un mot sur votre expérience avec Création Nowis.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="glass-panel-soft p-8"
        >
          <div className="flex gap-1 text-yellow-400" aria-label={`Note : ${review.rating} sur 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-[rgba(141,121,102,0.38)]'}>
                ★
              </span>
            ))}
          </div>
          <p className="mt-5 text-lg leading-8 text-[color:var(--site-text)]">"{review.comment}"</p>
          <div className="mt-6 border-t border-[rgba(131,97,67,0.12)] pt-5">
            <p className="font-semibold text-[color:var(--site-heading)]">{review.name}</p>
            {review.email && <p className="mt-1 text-sm text-[color:var(--site-muted)]">{review.email}</p>}
            {review.context && <p className="text-sm text-[color:var(--site-muted)]">{review.context}</p>}
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--site-soft)]">
              {new Date(review.createdAt).toLocaleDateString('fr-CA', { dateStyle: 'medium' })}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
