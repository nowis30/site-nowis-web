'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { FileUploader } from '@/features/crm/components/shared/FileUploader';
import {
  FINANCE_ENTRY_STATUS_LABELS,
  FINANCE_EXPENSE_CATEGORIES,
  FINANCE_EXPENSE_CATEGORY_LABELS,
  FINANCE_INVENTORY_CATEGORIES,
  FINANCE_INVENTORY_CATEGORY_LABELS,
  FINANCE_PAYMENT_METHODS,
  FINANCE_PAYMENT_METHOD_LABELS,
  FINANCE_SALE_TYPE_LABELS,
  FINANCE_SALE_TYPES,
  getInventoryCategoryLabel,
} from '@/features/crm/finance/constants';

export type FinanceSelectItem = { id: string; label: string };

export type FinanceInvoiceOption = {
  id: string;
  number: string;
  status: string;
  contact: { fullName: string };
};

export type FinanceInventoryItemRow = {
  id: string;
  sku: string;
  label: string;
  category: string;
  description: string | null;
  active: boolean;
  lowStockThreshold: number;
  quantityPurchased: number;
  quantitySold: number;
  quantityRemaining: number;
  purchaseUnitCost: string;
  salePrice: string;
};

type FinanceInventorySaleOption = {
  id: string;
  sku: string;
  label: string;
  category: string;
  salePrice: string;
  quantityRemaining: number;
  lowStockThreshold: number;
};

const money = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });

async function uploadReceipt(file: File) {
  const presignResponse = await fetch('/api/crm/file-documents/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      folder: 'finance-receipts',
    }),
  });
  const presignData = await presignResponse.json();
  if (!presignResponse.ok) {
    throw new Error(presignData.error || 'Impossible de préparer le téléversement.');
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error('Téléversement du fichier impossible.');
  }

  const finalizeResponse = await fetch('/api/crm/file-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visibility: 'admin_only',
      file: presignData.file,
    }),
  });
  const finalizeData = await finalizeResponse.json();
  if (!finalizeResponse.ok) {
    throw new Error(finalizeData.error || 'Impossible d’enregistrer le reçu.');
  }

  return finalizeData.item as { id: string; originalName: string };
}

async function submitJson(url: string, payload: Record<string, unknown>, method: 'POST' | 'PATCH' = 'POST') {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Action impossible');
  }
}

function FormShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="finance-form-surface space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary-300">Module finance</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <a href="/crm/finance" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/50 hover:text-white">Retour dashboard</a>
      </div>
      {children}
    </section>
  );
}

export function FinanceSaleFormPage({
  contacts,
  invoices,
  inventory,
}: {
  contacts: FinanceSelectItem[];
  invoices: FinanceInvoiceOption[];
  inventory: FinanceInventorySaleOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [saleReceipt, setSaleReceipt] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [quantityDraft, setQuantityDraft] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('OTHER');
  const [amountBeforeTaxDraft, setAmountBeforeTaxDraft] = useState('0');
  const [descriptionDraft, setDescriptionDraft] = useState('');

  const saleOptions = useMemo(() => FINANCE_SALE_TYPES.map((value) => ({ value, label: FINANCE_SALE_TYPE_LABELS[value] })), []);
  const paymentOptions = useMemo(() => FINANCE_PAYMENT_METHODS.map((value) => ({ value, label: FINANCE_PAYMENT_METHOD_LABELS[value] })), []);
  const selectedInventory = useMemo(
    () => inventory.find((item) => item.id === selectedInventoryId) ?? null,
    [inventory, selectedInventoryId],
  );
  const suggestedAmount = selectedInventory ? Number(selectedInventory.salePrice) * Math.max(1, quantityDraft) : null;

  useEffect(() => {
    if (selectedInventory) {
      const nextAmount = Number(selectedInventory.salePrice) * Math.max(1, quantityDraft);
      setSelectedCategory(selectedInventory.category || 'OTHER');
      setAmountBeforeTaxDraft(nextAmount.toFixed(2));
      setDescriptionDraft((current) => current.trim() ? current : selectedInventory.label);
      return;
    }

    setSelectedCategory('OTHER');
    setAmountBeforeTaxDraft('0');
  }, [selectedInventory, quantityDraft]);

  return (
    <FormShell title="Ajouter une vente" description="Créer un revenu et ajuster automatiquement le stock de n’importe quel produit actif.">
      <form
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget as HTMLFormElement;
          const form = new FormData(formElement);
          setSaleError(null);
          setSaleSuccess(null);
          (async () => {
            try {
              await submitJson('/api/crm/finance/entries', {
                kind: 'SALE',
                inventoryItemId: form.get('inventoryItemId') || null,
                contactId: form.get('contactId') || null,
                invoiceId: form.get('invoiceId') || null,
                receiptDocumentId: saleReceipt,
                counterpartyName: String(form.get('counterpartyName') || '').trim() || null,
                category: String(form.get('category') || selectedCategory || selectedInventory?.category || 'OTHER'),
                description: String(form.get('description') || descriptionDraft || '').trim() || null,
                quantity: Number(form.get('quantity') || 1),
                amountBeforeTax: Number(form.get('amountBeforeTax') || amountBeforeTaxDraft || 0),
                taxAmount: Number(form.get('taxAmount') || 0),
                paymentMethod: String(form.get('paymentMethod') || 'OTHER'),
                status: String(form.get('status') || 'PAID'),
                notes: String(form.get('notes') || '').trim() || null,
                entryDate: String(form.get('entryDate') || '') || undefined,
              });
              setSaleSuccess('Vente enregistrée.');
              formElement.reset();
              setSaleReceipt(null);
              setSelectedInventoryId('');
              setQuantityDraft(1);
              setSelectedCategory('OTHER');
              setAmountBeforeTaxDraft('0');
              setDescriptionDraft('');
            } catch (error) {
              setSaleError(error instanceof Error ? error.message : 'Erreur inconnue');
            }
          })();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="entryDate" type="date" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select name="contactId" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            <option value="">Client</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.label}</option>)}
          </select>
          <select
            name="inventoryItemId"
            value={selectedInventoryId}
            onChange={(event) => {
              const nextInventoryId = event.target.value;
              setSelectedInventoryId(nextInventoryId);
              const nextInventory = inventory.find((item) => item.id === nextInventoryId) ?? null;
              if (nextInventory) {
                setSelectedCategory(nextInventory.category || 'OTHER');
                setAmountBeforeTaxDraft((Number(nextInventory.salePrice) * Math.max(1, quantityDraft)).toFixed(2));
                setDescriptionDraft(nextInventory.label);
              } else {
                setSelectedCategory('OTHER');
                setAmountBeforeTaxDraft('0');
              }
            }}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2"
          >
            <option value="">Produit d'inventaire (optionnel)</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} · {getInventoryCategoryLabel(item.category)} · Stock {item.quantityRemaining}
              </option>
            ))}
          </select>
          <input name="counterpartyName" placeholder="Client ou acheteur" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select
            name="category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
            disabled={Boolean(selectedInventory)}
          >
            {saleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            {FINANCE_INVENTORY_CATEGORIES.map((value) => (
              <option key={value} value={value}>{FINANCE_INVENTORY_CATEGORY_LABELS[value]}</option>
            ))}
          </select>
          <input
            name="description"
            value={descriptionDraft}
            onChange={(event) => setDescriptionDraft(event.target.value)}
            placeholder="Description"
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2"
          />
          <input
            name="amountBeforeTax"
            type="number"
            step="0.01"
            min="0"
            value={amountBeforeTaxDraft}
            onChange={(event) => setAmountBeforeTaxDraft(event.target.value)}
            placeholder="Montant avant taxes"
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
          />
          <input name="taxAmount" type="number" step="0.01" min="0" placeholder="Taxes" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={1}
            placeholder="Quantité"
            onChange={(event) => {
              const nextQuantity = Math.max(1, Number(event.target.value) || 1);
              setQuantityDraft(nextQuantity);
              if (selectedInventory) {
                setAmountBeforeTaxDraft((Number(selectedInventory.salePrice) * nextQuantity).toFixed(2));
              }
            }}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
          />
          <select name="paymentMethod" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select name="status" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            {Object.keys(FINANCE_ENTRY_STATUS_LABELS).map((status) => (
              <option key={status} value={status}>{FINANCE_ENTRY_STATUS_LABELS[status as keyof typeof FINANCE_ENTRY_STATUS_LABELS]}</option>
            ))}
          </select>
          <select name="invoiceId" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2">
            <option value="">Facture liée (optionnel)</option>
            {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} · {invoice.contact.fullName}</option>)}
          </select>
          <textarea name="notes" rows={3} placeholder="Notes" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2" />
        </div>
        {selectedInventory ? (
          <p className="text-xs text-slate-400">
            Produit actif sélectionné: {selectedInventory.label} · Stock {selectedInventory.quantityRemaining}
            {suggestedAmount !== null ? ` · Montant suggéré: ${money.format(suggestedAmount)}` : ''}
          </p>
        ) : null}
        <div className="space-y-2">
          <FileUploader
            label={saleReceipt ? 'Reçu joint' : 'Joindre un reçu'}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onSelect={async (files) => {
              const file = files[0];
              if (!file) return;
              try {
                const uploaded = await uploadReceipt(file);
                setSaleReceipt(uploaded.id);
              } catch (error) {
                setSaleError(error instanceof Error ? error.message : 'Upload impossible');
              }
            }}
          />
          {saleReceipt ? <p className="text-xs text-emerald-300">Reçu lié: {saleReceipt}</p> : null}
        </div>
        {saleError ? <p className="text-sm text-red-300">{saleError}</p> : null}
        {saleSuccess ? <p className="text-sm text-emerald-300">{saleSuccess}</p> : null}
        <button type="submit" disabled={isPending} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">Enregistrer la vente</button>
      </form>
    </FormShell>
  );
}

export function FinanceExpenseFormPage() {
  const [isPending, startTransition] = useTransition();
  const [expenseReceipt, setExpenseReceipt] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);

  const expenseOptions = useMemo(() => FINANCE_EXPENSE_CATEGORIES.map((value) => ({ value, label: FINANCE_EXPENSE_CATEGORY_LABELS[value] })), []);
  const paymentOptions = useMemo(() => FINANCE_PAYMENT_METHODS.map((value) => ({ value, label: FINANCE_PAYMENT_METHOD_LABELS[value] })), []);

  return (
    <FormShell title="Ajouter une dépense" description="Enregistrer une dépense avec catégorie, mode de paiement et reçu.">
      <form
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget as HTMLFormElement;
          const form = new FormData(formElement);
          setExpenseError(null);
          setExpenseSuccess(null);
          (async () => {
            try {
              await submitJson('/api/crm/finance/entries', {
                kind: 'EXPENSE',
                contactId: null,
                invoiceId: null,
                receiptDocumentId: expenseReceipt,
                counterpartyName: String(form.get('supplier') || '').trim() || null,
                category: String(form.get('category') || 'OTHER'),
                description: String(form.get('description') || '').trim() || null,
                quantity: 1,
                amountBeforeTax: Number(form.get('amountBeforeTax') || 0),
                taxAmount: Number(form.get('taxAmount') || 0),
                paymentMethod: String(form.get('paymentMethod') || 'OTHER'),
                status: String(form.get('status') || 'PAID'),
                notes: String(form.get('notes') || '').trim() || null,
                entryDate: String(form.get('entryDate') || '') || undefined,
              });
              setExpenseSuccess('Dépense enregistrée.');
              formElement.reset();
              setExpenseReceipt(null);
            } catch (error) {
              setExpenseError(error instanceof Error ? error.message : 'Erreur inconnue');
            }
          })();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="entryDate" type="date" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="supplier" placeholder="Fournisseur" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select name="category" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2">
            {expenseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input name="description" placeholder="Description" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2" />
          <input name="amountBeforeTax" type="number" step="0.01" min="0" placeholder="Montant avant taxes" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="taxAmount" type="number" step="0.01" min="0" placeholder="Taxes" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select name="paymentMethod" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select name="status" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            {Object.keys(FINANCE_ENTRY_STATUS_LABELS).map((status) => (
              <option key={status} value={status}>{FINANCE_ENTRY_STATUS_LABELS[status as keyof typeof FINANCE_ENTRY_STATUS_LABELS]}</option>
            ))}
          </select>
          <textarea name="notes" rows={3} placeholder="Notes" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2" />
        </div>
        <div className="space-y-2">
          <FileUploader
            label={expenseReceipt ? 'Reçu joint' : 'Joindre un reçu'}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onSelect={async (files) => {
              const file = files[0];
              if (!file) return;
              try {
                const uploaded = await uploadReceipt(file);
                setExpenseReceipt(uploaded.id);
              } catch (error) {
                setExpenseError(error instanceof Error ? error.message : 'Upload impossible');
              }
            }}
          />
          {expenseReceipt ? <p className="text-xs text-emerald-300">Reçu lié: {expenseReceipt}</p> : null}
        </div>
        {expenseError ? <p className="text-sm text-red-300">{expenseError}</p> : null}
        {expenseSuccess ? <p className="text-sm text-emerald-300">{expenseSuccess}</p> : null}
        <button type="submit" disabled={isPending} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">Enregistrer la dépense</button>
      </form>
    </FormShell>
  );
}

export function FinanceInventoryFormPage({ inventory }: { inventory: FinanceInventoryItemRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventorySuccess, setInventorySuccess] = useState<string | null>(null);

  const selectedItem = useMemo(() => inventory.find((item) => item.id === selectedItemId) ?? null, [inventory, selectedItemId]);

  return (
    <FormShell title="Gérer l’inventaire produits" description="Créer des produits, réapprovisionner, ajuster les prix et gérer l’activation sans supprimer l’historique.">
      <form
        key={`inventory-update-${selectedItemId || 'none'}`}
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget as HTMLFormElement;
          const form = new FormData(formElement);
          setInventoryError(null);
          setInventorySuccess(null);
          (async () => {
            try {
              await submitJson('/api/crm/finance/inventory', {
                sku: String(form.get('sku') || '').trim() || null,
                label: String(form.get('label') || '').trim(),
                category: String(form.get('category') || 'OTHER'),
                description: String(form.get('description') || '').trim() || null,
                purchaseUnitCost: Number(form.get('purchaseUnitCost') || 0),
                salePrice: Number(form.get('salePrice') || 0),
                quantityPurchased: Number(form.get('quantityPurchased') || 0),
                quantityRemaining: Number(form.get('quantityRemaining') || 0),
                lowStockThreshold: Number(form.get('lowStockThreshold') || 3),
                active: form.get('active') === 'on',
              });
              setInventorySuccess('Produit créé dans l’inventaire.');
              formElement.reset();
              setSelectedItemId('');
            } catch (error) {
              setInventoryError(error instanceof Error ? error.message : 'Erreur inconnue');
            }
          })();
        }}
      >
        <h2 className="text-lg font-semibold text-white">Nouveau produit</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="label" required placeholder="Nom du produit" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select name="category" defaultValue="OTHER" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            {FINANCE_INVENTORY_CATEGORIES.map((value) => (
              <option key={value} value={value}>{FINANCE_INVENTORY_CATEGORY_LABELS[value]}</option>
            ))}
          </select>
          <input name="sku" placeholder="SKU / code interne (optionnel)" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="quantityPurchased" type="number" min="0" defaultValue={0} placeholder="Quantité achetée" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="quantityRemaining" type="number" min="0" defaultValue={0} placeholder="Quantité restante" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="purchaseUnitCost" type="number" step="0.01" min="0" placeholder="Coût d'achat unitaire" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="salePrice" required type="number" step="0.01" min="0" placeholder="Prix de vente" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="lowStockThreshold" type="number" min="0" defaultValue={3} placeholder="Seuil d'alerte" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <textarea name="description" rows={3} placeholder="Description" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
            <input name="active" type="checkbox" defaultChecked className="h-4 w-4" /> Produit actif
          </label>
        </div>
        {inventoryError ? <p className="text-sm text-red-300">{inventoryError}</p> : null}
        {inventorySuccess ? <p className="text-sm text-emerald-300">{inventorySuccess}</p> : null}
        <button type="submit" disabled={isPending} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">Créer le produit</button>
      </form>

      <form
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget as HTMLFormElement;
          const form = new FormData(formElement);
          const id = String(form.get('id') || '');
          if (!id) {
            setInventoryError('Sélectionne un produit à modifier.');
            return;
          }

          setInventoryError(null);
          setInventorySuccess(null);
          (async () => {
            try {
              const payload: Record<string, unknown> = { id };

              const restockQuantityRaw = String(form.get('restockQuantity') || '').trim();
              if (restockQuantityRaw) {
                const restockQuantity = Number(restockQuantityRaw);
                if (!Number.isFinite(restockQuantity) || restockQuantity < 0) {
                  throw new Error('Réapprovisionnement invalide.');
                }
                if (restockQuantity > 0) payload.restockQuantity = restockQuantity;
              }

              const quantityRemainingRaw = String(form.get('quantityRemaining') || '').trim();
              if (quantityRemainingRaw) {
                const quantityRemaining = Number(quantityRemainingRaw);
                if (!Number.isFinite(quantityRemaining) || quantityRemaining < 0) {
                  throw new Error('Quantité restante invalide.');
                }
                payload.quantityRemaining = quantityRemaining;
              }

              const purchaseUnitCostRaw = String(form.get('purchaseUnitCost') || '').trim();
              if (purchaseUnitCostRaw) {
                const purchaseUnitCost = Number(purchaseUnitCostRaw);
                if (!Number.isFinite(purchaseUnitCost) || purchaseUnitCost < 0) {
                  throw new Error('Coût unitaire invalide.');
                }
                payload.purchaseUnitCost = purchaseUnitCost;
              }

              const salePriceRaw = String(form.get('salePrice') || '').trim();
              if (salePriceRaw) {
                const salePrice = Number(salePriceRaw);
                if (!Number.isFinite(salePrice) || salePrice < 0) {
                  throw new Error('Prix de vente invalide.');
                }
                payload.salePrice = salePrice;
              }

              const lowStockThresholdRaw = String(form.get('lowStockThreshold') || '').trim();
              if (lowStockThresholdRaw) {
                const lowStockThreshold = Number(lowStockThresholdRaw);
                if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
                  throw new Error('Seuil d\'alerte invalide.');
                }
                payload.lowStockThreshold = lowStockThreshold;
              }

              const activeRaw = String(form.get('active') || 'unchanged');
              if (activeRaw === 'true' || activeRaw === 'false') {
                payload.active = activeRaw === 'true';
              }

              if (Object.keys(payload).length === 1) {
                throw new Error('Aucune modification détectée.');
              }

              await submitJson(
                '/api/crm/finance/inventory',
                payload,
                'PATCH',
              );
              setInventorySuccess('Produit mis à jour.');
              formElement.reset();
              setSelectedItemId('');
            } catch (error) {
              setInventoryError(error instanceof Error ? error.message : 'Erreur inconnue');
            }
          })();
        }}
      >
        <h2 className="text-lg font-semibold text-white">Réapprovisionnement / ajustements</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            name="id"
            value={selectedItemId}
            onChange={(event) => setSelectedItemId(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2"
          >
            <option value="">Produit existant</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} · {getInventoryCategoryLabel(item.category)} · Stock {item.quantityRemaining}
              </option>
            ))}
          </select>
          <input name="restockQuantity" type="number" min="0" defaultValue={0} placeholder="Réapprovisionnement (quantité +)" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="quantityRemaining" type="number" min="0" placeholder={`Quantité restante (actuelle: ${selectedItem?.quantityRemaining ?? '—'})`} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="purchaseUnitCost" type="number" step="0.01" min="0" placeholder={`Coût d'achat unitaire (actuel: ${selectedItem ? Number(selectedItem.purchaseUnitCost) : '—'})`} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="salePrice" type="number" step="0.01" min="0" placeholder={`Prix de vente (actuel: ${selectedItem ? Number(selectedItem.salePrice) : '—'})`} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="lowStockThreshold" type="number" min="0" placeholder={`Seuil d'alerte (actuel: ${selectedItem?.lowStockThreshold ?? '—'})`} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select name="active" defaultValue="unchanged" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            <option value="unchanged">Statut inchangé</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
        <button type="submit" disabled={isPending} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-white hover:border-primary-500/60 disabled:opacity-60">Appliquer les changements</button>
      </form>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">État actuel</h2>
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
                  <td className="py-3 pr-4">{money.format(Number(item.purchaseUnitCost))}</td>
                  <td className="py-3 pr-4">{money.format(Number(item.salePrice))}</td>
                  <td className="py-3 pr-4">
                    <span className={item.active ? 'text-emerald-300' : 'text-slate-500'}>{item.active ? 'Actif' : 'Inactif'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </FormShell>
  );
}

export function FinancePaymentFormPage({ invoices }: { invoices: FinanceInvoiceOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const paymentOptions = useMemo(() => FINANCE_PAYMENT_METHODS.map((value) => ({ value, label: FINANCE_PAYMENT_METHOD_LABELS[value] })), []);

  return (
    <FormShell title="Enregistrer un paiement de facture" description="Associer un paiement à une facture et mettre à jour le solde automatiquement.">
      <form
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget as HTMLFormElement;
          const form = new FormData(formElement);
          setPaymentError(null);
          setPaymentSuccess(null);
          const invoiceId = String(form.get('invoiceId') || '');
          if (!invoiceId) {
            setPaymentError('Choisis une facture.');
            return;
          }
          (async () => {
            try {
              await submitJson(`/api/crm/invoices/${invoiceId}/payments`, {
                amount: Number(form.get('amount') || 0),
                paymentMethod: String(form.get('paymentMethod') || 'OTHER'),
                note: String(form.get('note') || '').trim() || null,
                paidAt: String(form.get('paidAt') || '') || undefined,
                receiptDocumentId: paymentReceipt,
              });
              setPaymentSuccess('Paiement enregistré.');
              formElement.reset();
              setPaymentReceipt(null);
            } catch (error) {
              setPaymentError(error instanceof Error ? error.message : 'Erreur inconnue');
            }
          })();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="invoiceId" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white sm:col-span-2">
            <option value="">Facture</option>
            {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} · {invoice.contact.fullName} · {invoice.status}</option>)}
          </select>
          <input name="paidAt" type="date" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <input name="amount" type="number" step="0.01" min="0" placeholder="Montant payé" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
          <select name="paymentMethod" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
            {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input name="note" placeholder="Note" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
        </div>
        <div className="space-y-2">
          <FileUploader
            label={paymentReceipt ? 'Reçu joint' : 'Joindre une preuve de paiement'}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onSelect={async (files) => {
              const file = files[0];
              if (!file) return;
              try {
                const uploaded = await uploadReceipt(file);
                setPaymentReceipt(uploaded.id);
              } catch (error) {
                setPaymentError(error instanceof Error ? error.message : 'Upload impossible');
              }
            }}
          />
          {paymentReceipt ? <p className="text-xs text-emerald-300">Preuve liée: {paymentReceipt}</p> : null}
        </div>
        {paymentError ? <p className="text-sm text-red-300">{paymentError}</p> : null}
        {paymentSuccess ? <p className="text-sm text-emerald-300">{paymentSuccess}</p> : null}
        <button type="submit" disabled={isPending} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">Enregistrer le paiement</button>
      </form>
    </FormShell>
  );
}
