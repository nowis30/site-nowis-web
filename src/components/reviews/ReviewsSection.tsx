import { prisma } from '@/lib/prisma';

export async function ReviewsSection() {
  const reviews = await prisma.review.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      rating: true,
      comment: true,
      context: true,
    },
  });

  if (reviews.length === 0) return null;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
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
            {review.context && <p className="text-sm text-[color:var(--site-muted)]">{review.context}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
