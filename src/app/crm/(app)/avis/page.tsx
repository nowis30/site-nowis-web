import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { ReviewsModerationList } from '@/features/crm/components/reviews/ReviewsModerationList';

export default async function CrmAvisPage() {
  await requireCrmSession();

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      rating: true,
      comment: true,
      context: true,
      status: true,
      createdAt: true,
    },
  });

  const serialized = reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Avis clients</h1>
        <p className="mt-1 text-sm text-slate-400">
          Approuve ou rejette les avis avant publication sur le site.
        </p>
      </div>

      <ReviewsModerationList initialReviews={serialized} />
    </div>
  );
}
