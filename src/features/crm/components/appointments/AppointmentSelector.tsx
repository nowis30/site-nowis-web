'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';

type AppointmentItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  type: string;
  location: string | null;
  contact: { id: string; fullName: string } | null;
  organization: { id: string; name: string } | null;
};

interface AppointmentSelectorProps {
  onSelect: (appointmentId: string) => Promise<void>;
  loading?: boolean;
  contactId?: string | null;
  organizationId?: string | null;
  workshopRequestId?: string | null;
  songRequestId?: string | null;
  onlyUnlinked?: boolean;
  excludeTypes?: string[];
  label?: string;
  placeholder?: string;
}

export function AppointmentSelector({
  onSelect,
  loading = false,
  contactId,
  organizationId,
  workshopRequestId,
  songRequestId,
  onlyUnlinked = true,
  excludeTypes = [],
  label = 'Sélectionner un rendez-vous existant',
  placeholder = 'Chercher par titre...',
}: AppointmentSelectorProps) {
  const [query, setQuery] = useState('');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualId, setManualId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectLoading, setSelectLoading] = useState(false);

  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 1 && !onlyUnlinked) {
        setAppointments([]);
        return;
      }

      setSearching(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.length >= 2) params.append('q', searchQuery);
        if (contactId) params.append('contactId', contactId);
        if (organizationId) params.append('organizationId', organizationId);
        if (workshopRequestId) params.append('workshopRequestId', workshopRequestId);
        if (songRequestId) params.append('songRequestId', songRequestId);
        if (onlyUnlinked) params.append('onlyUnlinked', 'true');

        const response = await fetch(`/api/crm/appointments/search?${params.toString()}`);
        if (!response.ok) throw new Error('Recherche échouée');

        const data = (await response.json()) as { items: AppointmentItem[] };
        setAppointments(
          data.items.filter((apt) => !excludeTypes.includes(apt.type))
        );
      } catch (error) {
        console.error('Search error:', error);
        setAppointments([]);
      } finally {
        setSearching(false);
      }
    },
    [contactId, organizationId, workshopRequestId, songRequestId, onlyUnlinked, excludeTypes]
  );

  // Auto-search on component load or when filters change
  useEffect(() => {
    search(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, organizationId, workshopRequestId, songRequestId, onlyUnlinked]);

  const handleSearch = (value: string) => {
    setQuery(value);
    search(value);
  };

  const handleSelectAppointment = async (appointmentId: string) => {
    setSelectLoading(true);
    try {
      await onSelect(appointmentId);
      setSelectedId(appointmentId);
      setIsOpen(false);
      setQuery('');
    } finally {
      setSelectLoading(false);
    }
  };

  const handleSelectManualId = async () => {
    if (!manualId.trim()) return;
    setSelectLoading(true);
    try {
      await onSelect(manualId.trim());
      setManualId('');
      setShowAdvanced(false);
      setIsOpen(false);
    } finally {
      setSelectLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label>
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">{label}</span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading || selectLoading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-slate-100 hover:border-slate-600 disabled:opacity-60"
          >
            {selectedId
              ? appointments.find((a) => a.id === selectedId)?.title || 'Rendez-vous sélectionné'
              : 'Sélectionner un rendez-vous...'}
          </button>
        </label>
      </div>

      {isOpen && (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
          {/* Search input */}
          <div>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              disabled={searching}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            />
            {searching && <p className="mt-2 text-xs text-slate-400">Recherche en cours...</p>}
          </div>

          {/* Results list */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {appointments.length === 0 ? (
              <p className="text-sm text-slate-400">
                {searching ? 'Recherche...' : 'Aucun rendez-vous trouvé.'}
              </p>
            ) : (
              appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => handleSelectAppointment(appointment.id)}
                  disabled={selectLoading}
                  className="w-full text-left rounded-lg border border-slate-800 bg-slate-900/50 p-3 hover:border-slate-600 hover:bg-slate-900 transition-colors disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{appointment.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Intl.DateTimeFormat('fr-CA', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(appointment.startAt))}
                      </p>
                    </div>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {appointment.contact && (
                      <span>{appointment.contact.fullName}</span>
                    )}
                    {appointment.organization && (
                      <span>·{appointment.organization.name}</span>
                    )}
                    {appointment.type && (
                      <span>·{appointment.type}</span>
                    )}
                    {appointment.location && (
                      <span>·{appointment.location}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Close button */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white"
            >
              {showAdvanced ? 'Masquer avancé' : 'Mode avancé'}
            </button>
          </div>
        </div>
      )}

      {/* Advanced: Manual ID input */}
      {showAdvanced && (
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 space-y-2">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Lier par ID (avancé)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="UUID du rendez-vous"
              disabled={selectLoading}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            />
            <button
              type="button"
              onClick={handleSelectManualId}
              disabled={selectLoading || !manualId.trim()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white disabled:opacity-60"
            >
              Lier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
