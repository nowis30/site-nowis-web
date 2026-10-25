import Link from 'next/link';
import { requireCrmSession } from '@/features/crm/auth/session';
import { can } from '@/features/crm/auth/permissions';
import { loadQuebecTaxReport } from '@/lib/server/quebec-tax-report';
import { redirect } from 'next/navigation';

const money = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });

export default async function QuebecTaxReportPage(
  props: { searchParams?: Promise<{ from?: string; to?: string }> },
) {
  const session = await requireCrmSession();
  if (!can(session.role, 'finance', 'read')) redirect('/crm/historique');

  const searchParams = await props.searchParams;
  let report: Awaited<ReturnType<typeof loadQuebecTaxReport>> | null = null;
  let error: string | null = null;
  try {
    report = await loadQuebecTaxReport(searchParams?.from, searchParams?.to);
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '';
    error = message === 'Date invalide.' || message.startsWith('La date de fin') || message.startsWith('La période')
      ? message
      : 'Impossible de préparer le sommaire.';
  }

  const period = report?.period;
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Revenu Québec</p>
          <h1 className="text-2xl font-semibold text-white">Sommaire TPS / TVQ</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            Montants à reporter pour la période. Ce sommaire ne transmet rien à Revenu Québec et ne remplace pas la déclaration.
          </p>
        </div>
        {period ? (
          <a
            href={`/api/crm/finance/taxes?from=${period.from}&to=${period.to}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white"
          >
            Télécharger le CSV
          </a>
        ) : null}
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2" method="get">
        <label className="text-sm text-slate-300">Du
          <input type="date" name="from" defaultValue={searchParams?.from || period?.from || ''} className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white" />
        </label>
        <label className="text-sm text-slate-300">Au
          <input type="date" name="to" defaultValue={searchParams?.to || period?.to || ''} className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white" />
        </label>
        <button type="submit" className="min-h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-white sm:col-span-2">Afficher la période</button>
      </form>

      {error ? <p className="rounded-xl border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Fournitures taxables', report.summary.taxableSupplies],
              ['Fournitures non taxables', report.summary.exemptSupplies],
              ['TPS perçue', report.summary.gstCollected],
              ['TVQ perçue', report.summary.qstCollected],
            ].map(([label, value]) => (
              <article key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{money.format(Number(value))}</p>
              </article>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Préparation du dossier</h2>
              <Link href="/crm/settings" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-300">Compléter le profil</Link>
            </div>
            <ul className="mt-3 space-y-2">
              {report.readiness.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm">
                  <p className={item.ok ? 'font-semibold text-emerald-300' : 'font-semibold text-amber-200'}>{item.ok ? 'Prêt' : 'À compléter'} · {item.label}</p>
                  <p className="mt-1 text-slate-400">{item.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Les taxes ne sont ajoutées aux nouvelles factures directes que si les numéros TPS ou TVQ sont enregistrés et que les taxes sont actives. Les brouillons et les factures d’essai sont exclus.
            </p>
          </section>

          <div className="space-y-3 md:hidden">
            {report.summary.lines.length === 0 ? <p className="text-sm text-slate-400">Aucune facture émise sur cette période.</p> : report.summary.lines.map((line) => (
              <article key={line.number} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
                <p className="font-semibold text-white">{line.number}</p>
                <p className="text-slate-400">{line.issueDate.slice(0, 10)} · {line.status}</p>
                <p className="mt-2 text-slate-300">TPS {money.format(line.gstAmount)} · TVQ {money.format(line.qstAmount)}</p>
                <p className="font-semibold text-white">Total {money.format(line.total)}</p>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-800 md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-3">Facture</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Taxable</th>
                  <th className="px-3 py-3">TPS</th>
                  <th className="px-3 py-3">TVQ</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.lines.map((line) => (
                  <tr key={line.number} className="border-t border-slate-800">
                    <td className="px-3 py-3 text-white">{line.number}</td>
                    <td className="px-3 py-3 text-slate-300">{line.issueDate.slice(0, 10)}</td>
                    <td className="px-3 py-3">{money.format(line.taxableBase)}</td>
                    <td className="px-3 py-3">{money.format(line.gstAmount)}</td>
                    <td className="px-3 py-3">{money.format(line.qstAmount)}</td>
                    <td className="px-3 py-3 text-white">{money.format(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
