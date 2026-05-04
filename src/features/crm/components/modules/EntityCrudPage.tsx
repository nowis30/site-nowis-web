'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/features/crm/components/shared/ConfirmDialog';
import { DataColumn, DataTable } from '@/features/crm/components/shared/DataTable';
import { EmptyState } from '@/features/crm/components/shared/EmptyState';
import { SearchBar } from '@/features/crm/components/shared/SearchBar';
import { deleteResource, patchResource, useCrudResourceWithParams } from '@/features/crm/hooks/useCrudResource';

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
  createFormLink?: {
    href: string;
    label: string;
  };
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

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildAddressLine(address: unknown, city: unknown): string {
  const a = asText(address);
  const c = asText(city);
  if (a && c) return `${a}, ${c}`;
  return a || c;
}

function getText(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function buildOutlookHref(email: unknown) {
  const text = getText(email);
  return text ? `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(text)}` : '';
}

function buildTelHref(phone: unknown) {
  const text = getText(phone);
  return text ? `tel:${text.replace(/\s+/g, '')}` : '';
}

function getEmptyStateCopy(endpoint: string, view: 'active' | 'archived' | 'deleted', workshopStatus: string) {
  if (endpoint === '/api/crm/contacts') {
    if (view === 'deleted') return { title: 'Aucun contact supprimé', description: 'Aucun contact dans cette vue.' };
    if (view === 'archived') return { title: 'Aucun contact archivé', description: 'Aucun contact archivé pour le moment.' };
    return { title: 'Aucun contact trouvé', description: 'Ajoutez un premier contact ou ajustez vos filtres.' };
  }

  if (endpoint === '/api/crm/organizations') {
    if (view === 'deleted') return { title: 'Aucune organisation supprimée', description: 'Aucune organisation dans cette vue.' };
    if (view === 'archived') return { title: 'Aucune organisation archivée', description: 'Aucune organisation archivée pour le moment.' };
    return { title: 'Aucune organisation trouvée', description: 'Ajoutez une organisation ou modifiez vos filtres.' };
  }

  if (endpoint === '/api/crm/workshop-requests') {
    if (workshopStatus === 'DELETED') return { title: 'Aucune demande supprimée', description: 'Aucune demande d’atelier supprimée.' };
    return { title: 'Aucune demande atelier', description: 'Ajustez vos filtres ou créez une nouvelle demande.' };
  }

  return { title: 'Aucune donnée', description: 'Ajoutez un premier enregistrement pour ce module.' };
}

export function EntityCrudPage({
  title,
  description,
  endpoint,
  fields,
  columns,
  hideCreateForm = false,
  createFormLink,
  createPermission,
  updatePermission,
  deletePermission,
  defaultValues,
  detailBasePath,
}: EntityCrudPageProps) {
  const hasLifecycleView = endpoint === '/api/crm/contacts' || endpoint === '/api/crm/organizations';
  const hasWorkshopStatusFilter = endpoint === '/api/crm/workshop-requests';
  const PAGE_SIZE = endpoint === '/api/crm/contacts' || endpoint === '/api/crm/organizations' ? 20 : 10;
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'active' | 'archived' | 'deleted'>('active');
  const [workshopStatus, setWorkshopStatus] = useState('ACTIFS');
  const [workshopCategory, setWorkshopCategory] = useState('ALL');
  const { items, loading, error, reload } = useCrudResourceWithParams<GenericRecord>(endpoint, search, {
    ...(hasLifecycleView ? { view } : {}),
    ...(hasWorkshopStatusFilter ? { status: workshopStatus } : {}),
    ...(hasWorkshopStatusFilter && workshopCategory !== 'ALL' ? { category: workshopCategory } : {}),
  });
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
      const mapper = field.sourceMapper;
      const rawItems = sourceData[field.sourceKey] ?? [];
      const options = rawItems.map((item) => ({
        value: mapper.value(item),
        label: mapper.label(item),
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
  }, [items, currentPage, PAGE_SIZE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, view, workshopStatus, workshopCategory]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  function applyAutofillForWorkshopOrganization(previous: Record<string, unknown>, organizationId: string) {
    if (endpoint !== '/api/crm/workshop-requests' || !organizationId) return previous;

    const organization = sourceData.organizations.find((item) => String(item.id ?? '') === organizationId);
    if (!organization) return previous;

    const primaryContact =
      organization.primaryContact && typeof organization.primaryContact === 'object'
        ? (organization.primaryContact as GenericRecord)
        : null;

    const firstOrganizationContact = sourceData.organizationContacts.find(
      (item) => String(item.organizationId ?? '') === organizationId,
    );

    const next = { ...previous };

    next.workshopType = 'ORGANIZATION';

    if (!asText(next.organizationName) && asText(organization.name)) {
      next.organizationName = asText(organization.name);
    }

    if (!asText(next.contactPerson) && asText(primaryContact?.fullName)) {
      next.contactPerson = asText(primaryContact?.fullName);
    }

    const knownPhone = asText(organization.phone) || asText(primaryContact?.phone) || asText(firstOrganizationContact?.phone);
    if (!asText(next.contactPhone) && knownPhone) {
      next.contactPhone = knownPhone;
    }

    const knownEmail = asText(organization.email) || asText(primaryContact?.email) || asText(firstOrganizationContact?.email);
    if (!asText(next.contactEmail) && knownEmail) {
      next.contactEmail = knownEmail;
    }

    const addressLine = buildAddressLine(organization.address, organization.city);
    if (!asText(next.addressOrLocation) && addressLine) {
      next.addressOrLocation = addressLine;
    }

    if (!asText(next.organizationContactId) && firstOrganizationContact?.id) {
      next.organizationContactId = String(firstOrganizationContact.id);
    }

    return next;
  }

  function applyFieldChange(
    previous: Record<string, unknown>,
    field: Pick<FieldConfig, 'name' | 'type'>,
    rawValue: string,
    checked: boolean,
  ) {
    const next = {
      ...previous,
      [field.name]: parseInputValue(field.type, rawValue, checked),
    };

    if (field.name === 'organizationId' && typeof next.organizationId === 'string') {
      return applyAutofillForWorkshopOrganization(next, next.organizationId);
    }

    return next;
  }

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

  async function runLifecycleAction(rowId: string, action: 'archive' | 'restore' | 'delete') {
    try {
      setActionError(null);
      await patchResource(endpoint, rowId, { action });
      await reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action impossible');
    }
  }

  function getRecordLifecycle(row: GenericRecord) {
    if (endpoint === '/api/crm/contacts' || endpoint === '/api/crm/organizations') {
      const value = String(row.crmStatus ?? 'ACTIVE').toUpperCase();
      if (value === 'DELETED') return 'deleted';
      if (value === 'ARCHIVED') return 'archived';
      return 'active';
    }
    if (endpoint === '/api/crm/workshop-requests') {
      const value = String(row.status ?? '').toUpperCase();
      return value === 'DELETED' ? 'deleted' : 'active';
    }
    return 'active';
  }

  const emptyStateCopy = getEmptyStateCopy(endpoint, view, workshopStatus);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {hideCreateForm && createPermission && createFormLink ? (
            <Link
              href={createFormLink.href}
              className="inline-flex items-center justify-center rounded-lg border border-primary-500/50 bg-primary-500/10 px-3 py-2 text-xs font-medium text-primary-200 hover:border-primary-400 hover:bg-primary-500/20 hover:text-white"
            >
              {createFormLink.label}
            </Link>
          ) : null}
          {hasLifecycleView ? (
            <select
              value={view}
              onChange={(event) => setView(event.target.value as 'active' | 'archived' | 'deleted')}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
            >
              <option value="active">Actifs</option>
              <option value="archived">Archivés</option>
              <option value="deleted">Supprimés</option>
            </select>
          ) : null}
          {hasWorkshopStatusFilter ? (
            <>
              <select
                value={workshopStatus}
                onChange={(event) => setWorkshopStatus(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ACTIFS">Actives</option>
                <option value="EN_ATTENTE_RDV">Nouvelles</option>
                <option value="RDV_PLANIFIE">Planifiées</option>
                <option value="CONFIRME">En cours</option>
                <option value="TERMINE">Terminées</option>
                <option value="DELETED">Supprimées</option>
              </select>
              <select
                value={workshopCategory}
                onChange={(event) => setWorkshopCategory(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">Toutes categories</option>
                <option value="AINES_RESIDENCE">Aines / residence</option>
                <option value="ECOLE">Ecole</option>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="COMMUNAUTAIRE">Communautaire</option>
                <option value="PRIVE">Prive</option>
              </select>
            </>
          ) : null}
          <SearchBar value={search} onChange={setSearch} />
        </div>
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
                        setFormValues((previous) => applyFieldChange(previous, field, event.target.value, false))
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
        <EmptyState title={emptyStateCopy.title} description={emptyStateCopy.description} />
      ) : (
        <div className="space-y-3">
          {actionError ? <p className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{actionError}</p> : null}
          <DataTable
            columns={columns}
            rows={paginatedItems}
            rowKey={(row) => String(row.id ?? '')}
            actions={(row) => {
              const rowId = typeof row.id === 'string' ? row.id : null;
              const lifecycle = getRecordLifecycle(row);
              const isContactsOrOrganizations = endpoint === '/api/crm/contacts' || endpoint === '/api/crm/organizations';
              const isWorkshop = endpoint === '/api/crm/workshop-requests';
              const emailHref = buildOutlookHref(row.email || row.contactEmail);
              const phoneHref = buildTelHref(row.phone || row.contactPhone);
              const contactId = getText(row.contactId);
              const organizationId = getText(row.organizationId);
              const invoiceHref = endpoint === '/api/crm/contacts' && rowId
                ? `/crm/invoices?contactId=${rowId}`
                : endpoint === '/api/crm/workshop-requests' && contactId
                  ? `/crm/invoices?contactId=${contactId}&workshopId=${rowId}`
                  : endpoint === '/api/crm/organizations' && organizationId
                    ? `/crm/invoices?organizationId=${organizationId}`
                    : '';
              const submissionHref = endpoint === '/api/crm/workshop-requests' && rowId
                ? `/crm/commercial-quotes/new?workshopRequestId=${rowId}`
                : endpoint === '/api/crm/contacts' && rowId
                  ? `/crm/commercial-quotes/new?contactId=${rowId}`
                  : endpoint === '/api/crm/organizations' && rowId
                    ? `/crm/commercial-quotes/new?organizationId=${rowId}`
                    : '';
              const appointmentHref = endpoint === '/api/crm/contacts' && rowId
                ? `/crm/calendar?contactId=${rowId}`
                : endpoint === '/api/crm/organizations' && rowId
                  ? `/crm/calendar?organizationId=${rowId}`
                  : rowId
                    ? `/crm/workshop-requests/${rowId}`
                    : '/crm/calendar';

              return (
                <>
                  <details className="md:hidden">
                    <summary className="cursor-pointer rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200">Actions</summary>
                    <div className="mt-2 flex flex-col gap-1">
                      {detailBasePath && rowId ? (
                        <Link href={`${detailBasePath}/${rowId}`} className="rounded-md border border-primary-500/50 px-2 py-1 text-xs text-primary-300 hover:bg-primary-900/30">
                          Voir
                        </Link>
                      ) : null}
                      {updatePermission ? (
                        <button type="button" onClick={() => startEdit(row)} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 text-left">
                          Modifier
                        </button>
                      ) : null}
                      {emailHref ? <a href={emailHref} target="_blank" rel="noreferrer" className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 text-left">Envoyer courriel</a> : null}
                      {phoneHref ? <a href={phoneHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 text-left">Appeler</a> : null}
                      {endpoint === '/api/crm/contacts' ? <Link href={appointmentHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Créer rendez-vous</Link> : null}
                      {invoiceHref ? <Link href={invoiceHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Créer facture</Link> : null}
                      {submissionHref ? <Link href={submissionHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Créer soumission</Link> : null}
                      {updatePermission && rowId && isContactsOrOrganizations && lifecycle === 'active' ? (
                        <button type="button" onClick={() => void runLifecycleAction(rowId, 'archive')} className="rounded-md border border-amber-500/50 px-2 py-1 text-xs text-amber-300 text-left">
                          Archiver
                        </button>
                      ) : null}
                      {updatePermission && rowId && isWorkshop && lifecycle === 'active' ? (
                        <button type="button" onClick={() => void runLifecycleAction(rowId, 'archive')} className="rounded-md border border-amber-500/50 px-2 py-1 text-xs text-amber-300 text-left">
                          Archiver
                        </button>
                      ) : null}
                      {deletePermission && rowId ? (
                        <button type="button" onClick={() => setDeletingId(rowId)} className="rounded-md border border-red-500/50 px-2 py-1 text-xs text-red-300 text-left">
                          Supprimer
                        </button>
                      ) : null}
                      {updatePermission && rowId && (
                        (isContactsOrOrganizations && lifecycle !== 'active') ||
                        (isWorkshop && lifecycle === 'deleted')
                      ) ? (
                        <button type="button" onClick={() => void runLifecycleAction(rowId, 'restore')} className="rounded-md border border-emerald-500/50 px-2 py-1 text-xs text-emerald-300 text-left">
                          Restaurer
                        </button>
                      ) : null}
                    </div>
                  </details>

                  <div className="hidden flex-wrap gap-2 md:flex">
                    {detailBasePath && rowId ? (
                      <Link
                        href={`${detailBasePath}/${rowId}`}
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
                    {emailHref ? <a href={emailHref} target="_blank" rel="noreferrer" className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Courriel</a> : null}
                    {phoneHref ? <a href={phoneHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Appeler</a> : null}
                    {endpoint === '/api/crm/contacts' ? <Link href={appointmentHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Rendez-vous</Link> : null}
                    {invoiceHref ? <Link href={invoiceHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Facture</Link> : null}
                    {submissionHref ? <Link href={submissionHref} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Soumission</Link> : null}
                    {updatePermission && rowId && isContactsOrOrganizations && lifecycle === 'active' ? (
                      <button
                        type="button"
                        onClick={() => void runLifecycleAction(rowId, 'archive')}
                        className="rounded-md border border-amber-500/50 px-2 py-1 text-xs text-amber-300"
                      >
                        Archiver
                      </button>
                    ) : null}
                    {updatePermission && rowId && isWorkshop && lifecycle === 'active' ? (
                      <button
                        type="button"
                        onClick={() => void runLifecycleAction(rowId, 'archive')}
                        className="rounded-md border border-amber-500/50 px-2 py-1 text-xs text-amber-300"
                      >
                        Archiver
                      </button>
                    ) : null}
                    {deletePermission && rowId ? (
                      <button
                        type="button"
                        onClick={() => setDeletingId(rowId)}
                        className="rounded-md border border-red-500/50 px-2 py-1 text-xs text-red-300"
                      >
                        Supprimer
                      </button>
                    ) : null}
                    {updatePermission && rowId && (
                      (isContactsOrOrganizations && lifecycle !== 'active') ||
                      (isWorkshop && lifecycle === 'deleted')
                    ) ? (
                      <button
                        type="button"
                        onClick={() => void runLifecycleAction(rowId, 'restore')}
                        className="rounded-md border border-emerald-500/50 px-2 py-1 text-xs text-emerald-300"
                      >
                        Restaurer
                      </button>
                    ) : null}
                  </div>
                </>
              );
            }}
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
        description="Cette action enverra l’élément dans la vue des éléments supprimés."
        onCancel={() => setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
