'use client';

import {
  FINANCE_ENTRY_STATUS_LABELS,
  getFinanceCategoryLabel,
  getInventoryCategoryLabel,
} from '@/features/crm/finance/constants';

type FinanceEntry = {
  id: string;
  kind: 'SALE' | 'EXPENSE';
  entryDate: string;
  counterpartyName: string | null;
  category: string;
  description: string | null;
  quantity: number;
  amountBeforeTax: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  contact?: { fullName: string } | null;
};

type FinanceInventoryItem = {
  id: string;
  sku: string;
  label: string;
  category: string;
  description: string | null;
  purchaseUnitCost: string;
  salePrice: string;
  quantityPurchased: number;
  quantitySold: number;
  quantityRemaining: number;
  lowStockThreshold: number;
  active: boolean;
};

interface FinancePageProps {
  metrics: {
    monthRevenue: string;
    monthExpenses: string;
    monthProfit: string;
    yearRevenue: string;
    yearExpenses: string;
    yearProfit: string;
    unpaidInvoices: number;
    stockRemaining: number;
  };
  topProducts: Array<{ category: string; revenue: string; quantity: number }>;
  sales: FinanceEntry[];
  expenses: FinanceEntry[];
  inventory: FinanceInventoryItem[];
}

const money = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function FinancePage({ metrics, topProducts, sales, expenses, inventory }: FinancePageProps) {

  return (
    <section className="finance-form-surface space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary-300">Module finance</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Registre financier simple</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Suivi des ventes, des dépenses, des factures et de l’inventaire produits sans logique comptable lourde.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button type="button" onClick={() => window.print()} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 hover:border-primary-500/50 hover:text-white">
            Imprimer / PDF
          </button>
          <a href="/api/crm/finance/reports/export?scope=month" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 hover:border-primary-500/50 hover:text-white">
            Export CSV mois
          </a>
          <a href="/api/crm/finance/reports/export?scope=quarter" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 hover:border-primary-500/50 hover:text-white">
            Export CSV trimestre
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Revenus du mois', value: money.format(toNumber(metrics.monthRevenue)) },
          { label: 'Dépenses du mois', value: money.format(toNumber(metrics.monthExpenses)) },
          { label: 'Profit / perte du mois', value: money.format(toNumber(metrics.monthProfit)) },
          { label: 'Revenus de l’année', value: money.format(toNumber(metrics.yearRevenue)) },
          { label: 'Dépenses de l’année', value: money.format(toNumber(metrics.yearExpenses)) },
          { label: 'Profit / perte annuel', value: money.format(toNumber(metrics.yearProfit)) },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-500">Factures impayées</p>
          <p className="mt-2 text-3xl font-bold text-white">{metrics.unpaidInvoices}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-500">Stock restant (tous produits)</p>
          <p className="mt-2 text-3xl font-bold text-white">{metrics.stockRemaining}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-2">
          <p className="text-xs text-slate-500">Meilleurs produits / services</p>
          <div className="mt-3 space-y-2">
            {topProducts.length === 0 ? <p className="text-sm text-slate-400">Aucune vente enregistrée.</p> : topProducts.map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm">
                <span className="text-slate-200">{getFinanceCategoryLabel('SALE', item.category)}</span>
                <span className="text-slate-400">{money.format(toNumber(item.revenue))} · {item.quantity} vente(s)</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/crm/finance/vente" className="rounded-full bg-primary-600 px-4 py-2 font-semibold text-white">Nouvelle vente</a>
        <a href="/crm/finance/depense" className="rounded-full border border-slate-700 px-4 py-2 text-slate-200">Nouvelle dépense</a>
        <a href="/crm/finance/inventaire" className="rounded-full border border-slate-700 px-4 py-2 text-slate-200">Inventaire</a>
        <a href="/crm/finance/paiement" className="rounded-full border border-slate-700 px-4 py-2 text-slate-200">Paiement</a>
        <a href="#rapport" className="rounded-full border border-slate-700 px-4 py-2 text-slate-200">Voir rapport trimestriel</a>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">Ventes récentes</h2>
          <div className="mt-4 space-y-2">
            {sales.length === 0 ? <p className="text-sm text-slate-400">Aucune vente.</p> : sales.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span>{getFinanceCategoryLabel('SALE', entry.category)}</span>
                  <span className="text-slate-400">{money.format(toNumber(entry.totalAmount))}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{entry.counterpartyName || entry.contact?.fullName || 'Sans client'} · {FINANCE_ENTRY_STATUS_LABELS[entry.status as keyof typeof FINANCE_ENTRY_STATUS_LABELS] || entry.status}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">Dépenses récentes</h2>
          <div className="mt-4 space-y-2">
            {expenses.length === 0 ? <p className="text-sm text-slate-400">Aucune dépense.</p> : expenses.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span>{getFinanceCategoryLabel('EXPENSE', entry.category)}</span>
                  <span className="text-slate-400">{money.format(toNumber(entry.totalAmount))}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{entry.counterpartyName || 'Fournisseur'} · {FINANCE_ENTRY_STATUS_LABELS[entry.status as keyof typeof FINANCE_ENTRY_STATUS_LABELS] || entry.status}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Inventaire</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="py-2 pr-4">Produit</th>
                <th className="py-2 pr-4">Catégorie</th>
                <th className="py-2 pr-4">Acheté</th>
                <th className="py-2 pr-4">Vendu</th>
                <th className="py-2 pr-4">Restant</th>
                <th className="py-2 pr-4">Coût</th>
                <th className="py-2 pr-4">Prix</th>
                <th className="py-2 pr-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.sku}</div>
                  </td>
                  <td className="py-3 pr-4">{getInventoryCategoryLabel(item.category)}</td>
                  <td className="py-3 pr-4">{item.quantityPurchased}</td>
                  <td className="py-3 pr-4">{item.quantitySold}</td>
                  <td className="py-3 pr-4">
                    <span className={item.quantityRemaining <= item.lowStockThreshold ? 'rounded-md bg-amber-500/20 px-2 py-1 text-amber-200' : ''}>
                      {item.quantityRemaining}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{money.format(toNumber(item.purchaseUnitCost))}</td>
                  <td className="py-3 pr-4">{money.format(toNumber(item.salePrice))}</td>
                  <td className="py-3 pr-4">
                    <span className={item.active ? 'text-emerald-300' : 'text-slate-500'}>{item.active ? 'Actif' : 'Inactif'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article id="rapport" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Rapport trimestriel rapide</h2>
        <p className="mt-2 text-sm text-slate-400">Télécharge un CSV ou imprime cette page pour ton comptable.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="/api/crm/finance/reports/export?scope=month" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">Mois</a>
          <a href="/api/crm/finance/reports/export?scope=quarter" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">Trimestre</a>
          <a href="/api/crm/finance/reports/export?scope=year" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">Année</a>
        </div>
      </article>
    </section>
  );
}
