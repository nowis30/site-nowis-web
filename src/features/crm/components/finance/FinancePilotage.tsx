'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ACTIVITY_ORDER,
  DEFAULT_SIMULATION,
  accountantSummary,
  monthlyEvolution,
  simulateYear,
  type LedgerLine,
  type SimulationInput,
} from '@/features/crm/finance/activity';

type Operations = {
  songsInProgress: number;
  songsDelivered: number;
  workshopsInProgress: number;
  workshopsDone: number;
  usbRemaining: number;
};

const money = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });

const SIMULATION_FIELDS: Array<{ count: keyof SimulationInput; price: keyof SimulationInput; label: string; hint: string }> = [
  { count: 'songCount', price: 'songPrice', label: 'Chansons', hint: 'prix de départ 30 $' },
  { count: 'showCount', price: 'showPrice', label: 'Spectacles', hint: 'cachet avant taxes' },
  { count: 'workshopCount', price: 'workshopPrice', label: 'Ateliers', hint: 'atelier à 500 $' },
  { count: 'usb2Count', price: 'usb2Price', label: 'Clés USB 2 GB', hint: '20 $' },
  { count: 'usb16Count', price: 'usb16Price', label: 'Clés USB 16 GB', hint: '40 $' },
];

export function FinancePilotage({
  year,
  ledger,
  operations,
}: {
  year: number;
  ledger: LedgerLine[];
  operations: Operations;
}) {
  const [scenario, setScenario] = useState<SimulationInput>(DEFAULT_SIMULATION);
  const summary = useMemo(() => accountantSummary(ledger, year), [ledger, year]);
  const months = useMemo(() => monthlyEvolution(ledger, year), [ledger, year]);
  const projection = useMemo(() => simulateYear(summary, scenario), [summary, scenario]);
  const peak = Math.max(1, ...months.map((month) => Math.max(month.revenue, month.expenses)));
  const shows = summary.activities.find((item) => item.key === 'shows');

  function updateScenario(key: keyof SimulationInput, value: number | boolean) {
    setScenario((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Activités de l’année {year}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Chansons vendues, spectacles, ateliers et clés USB viennent du registre des ventes. Les demandes en cours restent dans leurs dossiers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/crm/finance/vente?activite=chansons" className="rounded-full bg-primary-600 px-3 py-1.5 font-semibold text-white">Vente de chanson</Link>
            <Link href="/crm/finance/vente?activite=spectacles" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200">Vente de spectacle</Link>
            <Link href="/crm/finance/vente?activite=ateliers" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200">Vente d’atelier</Link>
            <Link href="/crm/finance/vente?activite=cles-usb" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200">Vente de clé USB</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ACTIVITY_ORDER.map((key) => {
            const activity = summary.activities.find((item) => item.key === key);
            if (!activity) return null;
            return (
              <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-medium text-white">{activity.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{money.format(activity.total)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {activity.quantity} unité{activity.quantity > 1 ? 's' : ''} · {activity.count} vente{activity.count > 1 ? 's' : ''} · avant taxes {money.format(activity.beforeTax)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/crm/song-requests" className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300 hover:border-primary-500/50">
            <span className="block text-white">Dossiers chanson</span>
            {operations.songsInProgress} en cours · {operations.songsDelivered} livrées ou terminées
          </Link>
          <Link href="/crm/workshop-requests" className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300 hover:border-primary-500/50">
            <span className="block text-white">Dossiers atelier</span>
            {operations.workshopsInProgress} en cours · {operations.workshopsDone} terminés
          </Link>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
            <span className="block text-white">Spectacles encaissés</span>
            {shows?.count ?? 0} vente{(shows?.count ?? 0) > 1 ? 's' : ''} cette année
          </div>
          <Link href="/crm/finance/inventaire" className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300 hover:border-primary-500/50">
            <span className="block text-white">Stock de clés USB</span>
            {operations.usbRemaining} restante{operations.usbRemaining > 1 ? 's' : ''}
          </Link>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Évolution {year}</h2>
        <p className="mt-1 text-sm text-slate-400">Revenus et dépenses de chaque mois, hors ventes annulées.</p>
        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {months.map((month) => (
            <div key={month.month} className="text-center">
              <div className="flex h-24 items-end justify-center gap-1">
                <div className="w-2 rounded-sm bg-primary-400" style={{ height: month.revenue > 0 ? `${Math.max(4, (month.revenue / peak) * 100)}%` : '0%' }} title={`Revenus ${money.format(month.revenue)}`} />
                <div className="w-2 rounded-sm bg-slate-500" style={{ height: month.expenses > 0 ? `${Math.max(4, (month.expenses / peak) * 100)}%` : '0%' }} title={`Dépenses ${money.format(month.expenses)}`} />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">{month.label.slice(0, 3)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary-400" /> Revenus</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-slate-500" /> Dépenses</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="py-2 pr-4">Mois</th>
                <th className="py-2 pr-4">Revenus</th>
                <th className="py-2 pr-4">Dépenses</th>
                <th className="py-2 pr-4">Profit</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2 pr-4">{month.label}</td>
                  <td className="py-2 pr-4">{money.format(month.revenue)}</td>
                  <td className="py-2 pr-4">{money.format(month.expenses)}</td>
                  <td className="py-2 pr-4">{money.format(month.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article id="rendu-comptable" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Rendu pour le comptable</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          La TPS et la TVQ sont séparées quand la taxe enregistrée correspond au taux du Québec (5 % + 9,975 %). Une taxe différente reste dans « taxes non ventilées ».
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Revenus avant taxes', summary.salesBeforeTax],
            ['TPS 5 %', summary.gst],
            ['TVQ 9,975 %', summary.qst],
            ['Taxes non ventilées', summary.otherTax],
            ['Revenus totaux', summary.salesTotal],
            ['Dépenses', summary.expensesTotal],
            ['Profit', summary.profit],
            ['Ventes non encaissées', summary.receivable],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-2 text-xl font-semibold text-white">{money.format(Number(value))}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="/api/crm/finance/reports/export?scope=month&format=comptable" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">CSV comptable — mois</a>
          <a href="/api/crm/finance/reports/export?scope=quarter&format=comptable" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">CSV comptable — trimestre</a>
          <a href="/api/crm/finance/reports/export?scope=year&format=comptable" className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">CSV comptable — année</a>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Simulation</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Ajoute des ventes imaginaires à l’année en cours. Rien n’est enregistré : tu peux essayer un cachet, un atelier ou un lot de clés avant de décider.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {SIMULATION_FIELDS.map((field) => (
            <fieldset key={field.label} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
              <legend className="px-1 text-sm text-white">{field.label}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-400">
                  Quantité
                  <input
                    type="number"
                    min="0"
                    value={Number(scenario[field.count])}
                    onChange={(event) => updateScenario(field.count, Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Prix avant taxes
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number(scenario[field.price])}
                    onChange={(event) => updateScenario(field.price, Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                  <span className="mt-1 block">{field.hint}</span>
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400">
            Dépenses supplémentaires
            <input
              type="number"
              min="0"
              step="0.01"
              value={scenario.extraExpenses}
              onChange={(event) => updateScenario('extraExpenses', Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex items-center gap-2 self-end rounded-xl border border-slate-800 px-3 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={scenario.applyQuebecTax}
              onChange={(event) => updateScenario('applyQuebecTax', event.target.checked)}
            />
            Ajouter TPS et TVQ au scénario
          </label>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 p-4">
            <dt className="text-xs text-slate-500">Revenus projetés</dt>
            <dd className="mt-2 text-xl font-semibold text-white">{money.format(projection.projectedRevenue)}</dd>
            <p className="mt-1 text-xs text-slate-400">dont {money.format(projection.addedRevenue)} ajoutés</p>
          </div>
          <div className="rounded-2xl border border-slate-800 p-4">
            <dt className="text-xs text-slate-500">Dépenses projetées</dt>
            <dd className="mt-2 text-xl font-semibold text-white">{money.format(projection.projectedExpenses)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-800 p-4">
            <dt className="text-xs text-slate-500">Profit projeté</dt>
            <dd className="mt-2 text-xl font-semibold text-white">{money.format(projection.projectedProfit)}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
