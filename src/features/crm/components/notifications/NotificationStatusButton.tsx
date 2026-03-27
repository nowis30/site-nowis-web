'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationStatusButtonProps {
  notificationId: string;
  handled: boolean;
}

export function NotificationStatusButton({ notificationId, handled }: NotificationStatusButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/crm/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handled: !handled }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error || 'Mise à jour impossible');
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${handled
          ? 'border border-emerald-700/60 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-950/60'
          : 'border border-amber-700/60 bg-amber-950/30 text-amber-200 hover:bg-amber-950/50'} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isPending ? 'Mise à jour...' : handled ? 'Marquer non traité' : 'Marquer traité'}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}