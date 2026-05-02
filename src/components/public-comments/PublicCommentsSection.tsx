import { prisma } from '@/lib/prisma';
import { PublicCommentForm } from './PublicCommentForm';

function formatCommentDate(date: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(date);
}

export async function PublicCommentsSection() {
  const comments = await prisma.publicComment.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ approvedAt: 'desc' }, { createdAt: 'desc' }],
    take: 6,
    select: {
      id: true,
      displayName: true,
      message: true,
      rating: true,
      createdAt: true,
    },
  });

  return (
    <section className="mt-10 rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-panel)] p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-[color:var(--site-heading)]">Commentaires des visiteurs</h2>
      <p className="mt-2 text-sm text-[color:var(--site-muted)]">
        Vous avez vécu un atelier, reçu une chanson ou découvert une création Nowis ? Laissez un commentaire.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-[color:var(--site-border)] bg-white/70 p-4 text-sm text-[color:var(--site-muted)] md:col-span-2">
            Aucun commentaire approuvé pour le moment.
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-2xl border border-[color:var(--site-border)] bg-white/75 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[color:var(--site-heading)]">{comment.displayName}</p>
                <p className="text-xs text-[color:var(--site-soft)]">{formatCommentDate(comment.createdAt)}</p>
              </div>
              {comment.rating ? (
                <p className="mt-1 text-xs text-amber-600">{'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}</p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-text)]">{comment.message}</p>
            </article>
          ))
        )}
      </div>

      <div className="mt-6">
        <PublicCommentForm sourcePage="/" />
      </div>
    </section>
  );
}
