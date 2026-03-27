import Link from 'next/link';

function formatBudget(value: string | null) {
  if (!value) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(value));
}

function formatStatus(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function ContactSongRequests({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    songType: string;
    language: string | null;
    eventType: string | null;
    theme: string | null;
    status: string;
    createdAt: string;
    budget: string | null;
  }>;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Aucune demande de chanson liée à ce contact.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.songType}</p>
            </div>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{formatStatus(item.status)}</span>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
            <p>Langue: <span className="text-slate-200">{item.language || '—'}</span></p>
            <p>Occasion: <span className="text-slate-200">{item.eventType || '—'}</span></p>
            <p>Thème: <span className="text-slate-200">{item.theme || '—'}</span></p>
            <p>Budget: <span className="text-slate-200">{formatBudget(item.budget)}</span></p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">Créée le {new Date(item.createdAt).toLocaleDateString('fr-CA')}</span>
            <Link href={`/crm/song-requests/${item.id}`} className="text-primary-300 hover:text-primary-200">
              Ouvrir la demande
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
