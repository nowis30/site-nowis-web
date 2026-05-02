import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { PublicCommentsModerationList } from '@/features/crm/components/public-comments/PublicCommentsModerationList';

export default async function CrmPublicCommentsPage() {
  await requireCrmSession();

  const comments = await prisma.publicComment.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      displayName: true,
      email: true,
      message: true,
      rating: true,
      status: true,
      sourcePage: true,
      approvedAt: true,
      rejectedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Commentaires publics</h1>
      <p className="mt-1 text-sm text-slate-400">
        Modération des commentaires visiteurs avant publication sur la page d’accueil.
      </p>
      <div className="mt-6">
        <PublicCommentsModerationList
          initialComments={comments.map((comment) => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
            approvedAt: comment.approvedAt ? comment.approvedAt.toISOString() : null,
            rejectedAt: comment.rejectedAt ? comment.rejectedAt.toISOString() : null,
          }))}
        />
      </div>
    </div>
  );
}
