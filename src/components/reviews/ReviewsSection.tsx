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
          className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] p-8 text-white shadow-card backdrop-blur-sm"
        >
          <div className="flex gap-1 text-yellow-400" aria-label={`Note : ${review.rating} sur 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-white/20'}>
                ★
              </span>
            ))}
          </div>
          <p className="mt-5 text-lg leading-8 text-slate-100">"{review.comment}"</p>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-semibold text-white">{review.name}</p>
            {review.context && <p className="text-sm text-slate-300">{review.context}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
