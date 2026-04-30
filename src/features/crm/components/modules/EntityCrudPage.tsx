'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/features/crm/components/shared/ConfirmDialog';
import { DataColumn, DataTable } from '@/features/crm/components/shared/DataTable';
import { EmptyState } from '@/features/crm/components/shared/EmptyState';
import { SearchBar } from '@/features/crm/components/shared/SearchBar';
import { deleteResource, useCrudResource } from '@/features/crm/hooks/useCrudResource';

type GenericRecord = Record<string, unknown>;

interface OptionItem {
  value: string;
  label: string;
}

type SourceKey = 'contacts' | 'organizations' | 'organizationContacts';

interface SourceMapper {
  value: (item: GenericRecord) => string;
  label: (item: GenericRecord) => string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  options?: OptionItem[];
  sourceKey?: SourceKey;
  sourceMapper?: SourceMapper;
}

interface EntityCrudPageProps {
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  columns: DataColumn<GenericRecord>[];
  hideCreateForm?: boolean;
  createPermission: boolean;
  updatePermission: boolean;
  deletePermission: boolean;
  defaultValues: Record<string, unknown>;
  detailBasePath?: string;
}

function parseInputValue(type: FieldConfig['type'], rawValue: string, checked: boolean) {
  if (type === 'checkbox') return checked;
  if (type === 'number') return rawValue === '' ? '' : Number(rawValue);
  return rawValue;
}

export function EntityCrudPage({
  title,
  description,
  endpoint,
  fields,
  columns,
  hideCreateForm = false,
  createPermission,
  updatePermission,
  deletePermission,
  defaultValues,
  detailBasePath,
}: EntityCrudPageProps) {
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const { items, loading, error, reload } = useCrudResource<GenericRecord>(endpoint, search);
  const [currentPage, setCurrentPage] = useState(1);

  const [formValues, setFormValues] = useState<Record<string, unknown>>(defaultValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [sourceData, setSourceData] = useState<Record<string, GenericRecord[]>>({
    contacts: [],
    organizations: [],
    organizationContacts: [],
  });

  useEffect(() => {
    async function loadOptions() {
      const response = await fetch('/api/crm/options', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setSourceData({
        contacts: data.contacts ?? [],
        organizations: data.organizations ?? [],
        organizationContacts: data.organizationContacts ?? [],
      });
    }

    void loadOptions();
  }, []);

  const computedFields = useMemo(() => {
    return fields.map((field) => {
      if (!field.sourceKey || !field.sourceMapper) return field;
      const rawItems = sourceData[field.sourceKey] ?? [];
      const options = rawItems.map((item) => ({
        value: field.sourceMapper?.value(item),
        label: field.sourceMapper?.label(item),
      }));
      return {
        ...field,
        options,
      };
    });
  }, [fields, sourceData]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(editingId ? `${endpoint}/${editingId}` : endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de sauvegarde');
      }
      setFormValues(defaultValues);
      setEditingId(null);
      await reload();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(row: GenericRecord) {
    const rowId = typeof row.id === 'string' ? row.id : null;
    if (!rowId) return;
    setEditingId(rowId);
    const nextValues: Record<string, unknown> = { ...defaultValues };
    computedFields.forEach((field) => {
      nextValues[field.name] = row[field.name] ?? defaultValues[field.name] ?? '';
    });
    setFormValues(nextValues);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      setActionError(null);
      await deleteResource(endpoint, deletingId);
      setDeletingId(null);
      await reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Suppression impossible');
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {((!hideCreateForm && (createPermission || updatePermission)) || (updatePermission && Boolean(editingId))) ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {computedFields.map((field) => {
              const rawValue = formValues[field.name];
              const value =
                typeof rawValue === 'string' || typeof rawValue === 'number'
                  ? rawValue
                  : '';

              if (field.type === 'textarea') {
                return (
                  <label key={field.name} className="md:col-span-2 xl:col-span-3">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">{field.label}</span>
                    <textarea
                      value={value}
                      required={field.required}
                      onChange={(event) =>
                        setFormValues((previous) => ({ ...previous, [field.name]: event.target.value }))
                      }
                      className="min-h-[96px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                );
              }

              if (field.type === 'select') {
                return (
                  <label key={field.name}>
                    <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">{field.label}</span>
                    <select
                      value={value}
                      required={field.required}
                      onChange={(event) =>
                        setFormValues((previous) => ({ ...previous, [field.name]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="">Sélectionner</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              if (field.type === 'checkbox') {
                return (
                  <label key={field.name} className="flex items-center gap-2 pt-7 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(formValues[field.name])}
                      onChange={(event) =>
                        setFormValues((previous) => ({ ...previous, [field.name]: event.target.checked }))
                      }
                    />
                    {field.label}
                  </label>
                );
              }

              return (
                <label key={field.name}>
                  <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">{field.label}</span>
                  <input
                    type={field.type}
                    value={value}
                    required={field.required}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        [field.name]: parseInputValue(field.type, event.target.value, event.target.checked),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              );
            })}
          </div>

          {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmitting || (!createPermission && !editingId)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormValues(defaultValues);
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200"
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {loading ? <p className="text-sm text-slate-400">Chargement…</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title="Aucune donnée" description="Ajoutez un premier enregistrement pour ce module." />
      ) : (
        <div className="space-y-3">
          {actionError ? <p className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{actionError}</p> : null}
          <DataTable
            columns={columns}
            rows={paginatedItems}
            rowKey={(row) => String(row.id ?? '')}
            actions={(row) => (
              <div className="flex gap-2">
                {detailBasePath && typeof row.id === 'string' ? (
                  <Link
                    href={`${detailBasePath}/${row.id}`}
                    className="rounded-md border border-primary-500/50 px-2 py-1 text-xs text-primary-300 hover:bg-primary-900/30"
                  >
                    Voir
                  </Link>
                ) : null}
                {updatePermission ? (
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200"
                  >
                    Modifier
                  </button>
                ) : null}
                {deletePermission ? (
                  <button
                    type="button"
                    onClick={() => setDeletingId(typeof row.id === 'string' ? row.id : null)}
                    className="rounded-md border border-red-500/50 px-2 py-1 text-xs text-red-300"
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>
            )}
          />

          <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Affichage {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, items.length)} sur {items.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-slate-400">
                Page {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Confirmer la suppression"
        description="Cette action est irréversible."
        onCancel={() => setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
