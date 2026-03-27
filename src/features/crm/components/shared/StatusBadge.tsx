'use client';

interface StatusBadgeProps {
  value: unknown;
}

const statusMap: Record<string, { label: string; color: string }> = {
  // Statuts de dossier
  OPEN: { label: 'Ouvert', color: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-sky-500/20 text-sky-200 border-sky-400/30' },
  ON_HOLD: { label: 'En pause', color: 'bg-orange-500/20 text-orange-200 border-orange-400/30' },
  CLOSED: { label: 'Fermé', color: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },

  // Autres statuts
  DRAFT: { label: 'Brouillon', color: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },
  SENT: { label: 'Envoyée', color: 'bg-blue-500/20 text-blue-200 border-blue-400/30' },
  ACTIVE: { label: 'Actif', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  INACTIVE: { label: 'Inactif', color: 'bg-slate-600/20 text-slate-300 border-slate-500/30' },
  ENDED: { label: 'Terminé', color: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },
  TERMINATED: { label: 'Résilié', color: 'bg-red-500/20 text-red-200 border-red-400/30' },
  OVERDUE: { label: 'En retard', color: 'bg-red-500/20 text-red-200 border-red-400/30' },

  // Statuts d'unité
  VACANT: { label: 'Vacant', color: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30' },
  OCCUPIED: { label: 'Occupé', color: 'bg-blue-500/20 text-blue-200 border-blue-400/30' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },

  // Statuts de paiement
  PAID: { label: 'Payé', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  PENDING: { label: 'En attente', color: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  LATE: { label: 'En retard', color: 'bg-red-500/20 text-red-200 border-red-400/30' },
  PARTIAL: { label: 'Partiel', color: 'bg-orange-500/20 text-orange-200 border-orange-400/30' },
  CANCELLED: { label: 'Annulé', color: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },

  // Maintenance
  RESOLVED: { label: 'Résolu', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },

  // Types de contact
  PROSPECT: { label: 'Prospect', color: 'bg-blue-500/20 text-blue-200 border-blue-400/30' },
  CLIENT: { label: 'Client', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  PARTENAIRE: { label: 'Partenaire', color: 'bg-purple-500/20 text-purple-200 border-purple-400/30' },
  PROPRIETAIRE: { label: 'Propriétaire', color: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30' },
  LOCATAIRE_PROSPECT: { label: 'Locataire prospect', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30' },

  // Autres types
  LOCATION: { label: 'Location', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30' },
  SUPPORT: { label: 'Support', color: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },

  // Priorités
  LOW: { label: 'Basse', color: 'bg-blue-500/20 text-blue-200 border-blue-400/30' },
  MEDIUM: { label: 'Moyenne', color: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  HIGH: { label: 'Haute', color: 'bg-orange-500/20 text-orange-200 border-orange-400/30' },
  URGENT: { label: 'Urgente', color: 'bg-red-500/20 text-red-200 border-red-400/30' },

  // Inquiry
  NEW: { label: 'Nouveau', color: 'bg-sky-500/20 text-sky-200 border-sky-400/30' },
  QUALIFIED: { label: 'Qualifié', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },

  // Task
  TODO: { label: 'À faire', color: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },
  DONE: { label: 'Fait', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },

  // Roles
  ADMIN: { label: 'Administrateur', color: 'bg-red-500/20 text-red-200 border-red-400/30' },
  ASSISTANT: { label: 'Assistant', color: 'bg-blue-500/20 text-blue-200 border-blue-400/30' },
  TENANT: { label: 'Locataire', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30' },

  // Property
  RESIDENTIAL: { label: 'Résidentiel', color: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  COMMERCIAL: { label: 'Commercial', color: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },
  MIXED: { label: 'Mixte', color: 'bg-purple-500/20 text-purple-200 border-purple-400/30' },

  // Direction
  INBOUND: { label: 'Entrant', color: 'bg-green-500/20 text-green-200 border-green-400/30' },
  OUTBOUND: { label: 'Sortant', color: 'bg-orange-500/20 text-orange-200 border-orange-400/30' },
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = typeof value === 'string' ? value : String(value ?? 'UNKNOWN');
  const status = statusMap[normalized] ?? {
    label: normalized.split('_').join(' '),
    color: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${status.color}`}>
      {status.label}
    </span>
  );
}
