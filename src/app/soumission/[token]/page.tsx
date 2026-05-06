'use client';

import { useEffect, useMemo, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type QuoteLine = {
  id: string;
  title: string;
  description: string | null;
  quantity: string;
  unitPrice: string;
  subtotal: string;
};

type QuotePayload = {
  id: string;
  quoteNumber: string;
  title: string;
  description: string | null;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  validUntil: string | null;
  contact: { fullName: string; email: string | null } | null;
  convertedToInvoice: { id: string; number: string; status: string } | null;
  lines: QuoteLine[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(value: string | number, currency = 'CAD') {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(Number(value));
}

function formatDateUtc(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

type StatusMeta = {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

function statusMeta(status: string): StatusMeta {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'Acceptée ✓', bg: '#f0fdf4', text: '#14532d', border: '#86efac', dot: '#16a34a' };
    case 'DECLINED':
      return { label: 'Refusée', bg: '#fef2f2', text: '#7f1d1d', border: '#fca5a5', dot: '#dc2626' };
    case 'SENT':
      return { label: 'En attente de réponse', bg: '#fffbeb', text: '#78350f', border: '#fcd34d', dot: '#d97706' };
    case 'EXPIRED':
      return { label: 'Expirée', bg: '#f8fafc', text: '#475569', border: '#cbd5e1', dot: '#64748b' };
    case 'CONVERTED':
      return { label: 'Convertie en facture', bg: '#eff6ff', text: '#1e3a8a', border: '#93c5fd', dot: '#2563eb' };
    default:
      return { label: status, bg: '#f8fafc', text: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
  }
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function NowisLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c97445 0%, #a05530 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1, letterSpacing: '-0.03em' }}>N</span>
      </div>
      <span style={{ fontWeight: 700, fontSize: 17, color: '#2e241d', letterSpacing: '-0.01em' }}>Création Nowis</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: meta.bg,
        color: meta.text,
        border: `1.5px solid ${meta.border}`,
        borderRadius: 999,
        padding: '4px 12px',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PublicQuotePage({ params }: { params: { token: string } }) {
  const [item, setItem] = useState<QuotePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'accept' | 'decline' } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(`/api/public/quotes/${params.token}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as { error?: string; item?: QuotePayload } | null;
      if (cancelled) return;
      if (!response.ok || !data?.item) {
        setFetchError(data?.error ?? 'Lien invalide ou expiré.');
      } else {
        setItem(data.item);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  const canRespond = useMemo(
    () => item && ['DRAFT', 'SENT'].includes(item.status) && !feedback,
    [item, feedback],
  );

  async function respond(action: 'accept' | 'decline') {
    setBusy(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/public/quotes/${params.token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; status?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? 'Action impossible');
      }
      setFeedback({ type: action });
      setItem((current) => (current ? { ...current, status: data?.status ?? current.status } : current));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  }

  // ── États chargement / erreur ─────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f6f1ea 0%, #f3ece3 52%, #efe7dc 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <NowisLogo />
        <div
          style={{
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(46,36,29,0.1)',
            borderRadius: 24,
            padding: '2rem',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid #e8d8c8',
              borderTopColor: '#b86f3d',
              animation: 'spin 0.9s linear infinite',
              margin: '0 auto 1.25rem',
            }}
          />
          <p style={{ color: '#6a5a4c', fontSize: 15 }}>Chargement de la soumission…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (fetchError || !item) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f6f1ea 0%, #f3ece3 52%, #efe7dc 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <NowisLogo />
        <div
          style={{
            marginTop: '2rem',
            background: '#fff8f5',
            border: '1.5px solid #fca5a5',
            borderRadius: 24,
            padding: '2rem 2.5rem',
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔗</p>
          <p style={{ color: '#7f1d1d', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Lien invalide ou expiré</p>
          <p style={{ color: '#6a5a4c', fontSize: 14, lineHeight: 1.6 }}>
            {fetchError ?? 'Cette soumission est introuvable ou ce lien n\'est plus valide.'}
          </p>
          <p style={{ color: '#8d7665', fontSize: 13, marginTop: 16 }}>
            Contactez{' '}
            <a href="mailto:simonmorin@nowis.store" style={{ color: '#b86f3d', fontWeight: 600 }}>
              simonmorin@nowis.store
            </a>{' '}
            pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  // ── Page principale ───────────────────────────────────────────────────────

  const status = statusMeta(item.status);
  const hasTax = Number(item.taxAmount) > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f6f1ea 0%, #f3ece3 52%, #efe7dc 100%)',
        color: '#2e241d',
        fontFamily: 'inherit',
      }}
    >
      {/* En-tête */}
      <header
        style={{
          background: 'rgba(255,255,255,0.82)',
          borderBottom: '1px solid rgba(46,36,29,0.1)',
          padding: '1rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <NowisLogo />
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* Bloc d'accueil */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(184,111,61,0.08) 0%, rgba(203,165,120,0.12) 100%)',
            border: '1.5px solid rgba(184,111,61,0.18)',
            borderRadius: 20,
            padding: '1.5rem 1.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b86f3d', marginBottom: 6 }}>
            Votre soumission
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2e241d', marginBottom: 6, lineHeight: 1.25 }}>
            {item.title}
          </h1>
          {item.contact?.fullName ? (
            <p style={{ color: '#6a5a4c', fontSize: 14 }}>
              Préparée pour <strong style={{ color: '#2e241d' }}>{item.contact.fullName}</strong>
            </p>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <StatusBadge status={item.status} />
          </div>
          {item.validUntil ? (
            <p style={{ color: '#8d7665', fontSize: 13, marginTop: 8 }}>
              Valide jusqu'au {formatDateUtc(item.validUntil)}
            </p>
          ) : null}
        </div>

        {/* Message humain selon statut */}
        {item.status === 'SENT' && !feedback ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(46,36,29,0.1)',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              color: '#4a3828',
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            Voici la soumission préparée pour votre projet. Vous pouvez la consulter, l'accepter ou me contacter si vous avez des questions.
          </div>
        ) : null}

        {/* Message de confirmation après action */}
        {feedback?.type === 'accept' ? (
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontWeight: 700, color: '#14532d', fontSize: 16, marginBottom: 4 }}>✓ Soumission acceptée !</p>
            <p style={{ color: '#166534', fontSize: 14, lineHeight: 1.6 }}>
              Merci pour votre confiance. La prochaine étape sera préparée et vous recevrez votre facture par courriel sous peu.
            </p>
          </div>
        ) : null}

        {feedback?.type === 'decline' ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 16, marginBottom: 4 }}>Soumission refusée</p>
            <p style={{ color: '#991b1b', fontSize: 14, lineHeight: 1.6 }}>
              Pas de problème. Vous pouvez communiquer avec Création Nowis pour ajuster le projet selon vos besoins.{' '}
              <a href="mailto:simonmorin@nowis.store" style={{ color: '#b86f3d', fontWeight: 600 }}>
                simonmorin@nowis.store
              </a>
            </p>
          </div>
        ) : null}

        {item.status === 'ACCEPTED' && !feedback ? (
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontWeight: 700, color: '#14532d', fontSize: 15, marginBottom: 4 }}>✓ Soumission déjà acceptée</p>
            <p style={{ color: '#166534', fontSize: 14 }}>Cette soumission a été acceptée. Merci pour votre confiance.</p>
          </div>
        ) : null}

        {item.status === 'DECLINED' && !feedback ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 15, marginBottom: 4 }}>Soumission refusée</p>
            <p style={{ color: '#991b1b', fontSize: 14 }}>
              Cette soumission a été refusée.{' '}
              <a href="mailto:simonmorin@nowis.store" style={{ color: '#b86f3d', fontWeight: 600 }}>
                Contactez-nous
              </a>{' '}
              pour en discuter.
            </p>
          </div>
        ) : null}

        {item.status === 'EXPIRED' ? (
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontWeight: 700, color: '#475569', fontSize: 15, marginBottom: 4 }}>Soumission expirée</p>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Cette soumission n'est plus valide.{' '}
              <a href="mailto:simonmorin@nowis.store" style={{ color: '#b86f3d', fontWeight: 600 }}>
                Demandez une mise à jour
              </a>
              .
            </p>
          </div>
        ) : null}

        {/* Conversion en facture */}
        {item.convertedToInvoice ? (
          <div
            style={{
              background: '#eff6ff',
              border: '1.5px solid #93c5fd',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ color: '#1e3a8a', fontSize: 14 }}>
              Cette soumission a été convertie en facture <strong>{item.convertedToInvoice.number}</strong>.
            </p>
          </div>
        ) : null}

        {/* Description du projet */}
        {item.description ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.82)',
              border: '1px solid rgba(46,36,29,0.1)',
              borderRadius: 20,
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#8d7665', marginBottom: 8 }}>
              Description du projet
            </p>
            <p style={{ color: '#4a3828', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.description}</p>
          </div>
        ) : null}

        {/* Tableau des services */}
        {item.lines.length > 0 ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(46,36,29,0.1)',
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(46,36,29,0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '0.75rem',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#8d7665',
              }}
            >
              <span>Service</span>
              <span style={{ textAlign: 'right' }}>Qté</span>
              <span style={{ textAlign: 'right' }}>Prix unit.</span>
              <span style={{ textAlign: 'right' }}>Sous-total</span>
            </div>

            {item.lines.map((line, idx) => (
              <div
                key={line.id}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: idx < item.lines.length - 1 ? '1px solid rgba(46,36,29,0.07)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: '#2e241d', fontSize: 14 }}>{line.title}</p>
                  {line.description ? (
                    <p style={{ color: '#8d7665', fontSize: 12, marginTop: 3 }}>{line.description}</p>
                  ) : null}
                </div>
                <p style={{ color: '#6a5a4c', fontSize: 13, textAlign: 'right', whiteSpace: 'nowrap' }}>{line.quantity}</p>
                <p style={{ color: '#6a5a4c', fontSize: 13, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatMoney(line.unitPrice, item.currency)}
                </p>
                <p style={{ fontWeight: 700, color: '#2e241d', fontSize: 14, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatMoney(line.subtotal, item.currency)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Résumé des montants */}
        <div
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(46,36,29,0.1)',
            borderRadius: 20,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {hasTax ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6a5a4c', fontSize: 14, marginBottom: 6 }}>
                <span>Sous-total</span>
                <span>{formatMoney(item.subtotal, item.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6a5a4c', fontSize: 14, marginBottom: 10 }}>
                <span>Taxes (TPS/TVQ)</span>
                <span>{formatMoney(item.taxAmount, item.currency)}</span>
              </div>
              <div
                style={{
                  borderTop: '1.5px solid rgba(46,36,29,0.1)',
                  paddingTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 16, color: '#2e241d' }}>Total</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: '#b86f3d',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {formatMoney(item.totalAmount, item.currency)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#2e241d' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: '#b86f3d', letterSpacing: '-0.02em' }}>
                {formatMoney(item.totalAmount, item.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Erreur d'action */}
        {actionError ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: 12,
              padding: '0.875rem 1.25rem',
              color: '#991b1b',
              fontSize: 14,
              marginBottom: '1.25rem',
            }}
          >
            {actionError}
          </div>
        ) : null}

        {/* Boutons d'action */}
        {canRespond ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.82)',
              border: '1px solid rgba(46,36,29,0.1)',
              borderRadius: 20,
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ color: '#4a3828', fontSize: 14, marginBottom: '1rem', lineHeight: 1.6 }}>
              Souhaitez-vous accepter cette soumission ? Vous pouvez aussi me contacter directement si vous avez des questions avant de décider.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => void respond('accept')}
                disabled={busy}
                style={{
                  background: busy ? '#d6b89a' : 'linear-gradient(135deg, #c97445 0%, #a05530 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '0.875rem 1.5rem',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s',
                  boxShadow: busy ? 'none' : '0 2px 8px rgba(184,111,61,0.3)',
                }}
              >
                {busy ? 'Traitement…' : '✓ Accepter la soumission'}
              </button>
              <button
                type="button"
                onClick={() => void respond('decline')}
                disabled={busy}
                style={{
                  background: '#fff',
                  color: '#7f1d1d',
                  border: '1.5px solid #fca5a5',
                  borderRadius: 12,
                  padding: '0.875rem 1.5rem',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.55 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                Refuser
              </button>
            </div>
          </div>
        ) : null}

        {/* Pied de page contact */}
        <div style={{ textAlign: 'center', color: '#8d7665', fontSize: 13, marginTop: '2.5rem', lineHeight: 1.7 }}>
          <p>Une question ? Écrivez-moi à</p>
          <a
            href="mailto:simonmorin@nowis.store"
            style={{ color: '#b86f3d', fontWeight: 600, fontSize: 14 }}
          >
            simonmorin@nowis.store
          </a>
          <p style={{ marginTop: 4 }}>ou appelez le (819) 388-3407</p>
          <p style={{ marginTop: 12, fontSize: 12, color: '#b8a898' }}>© Création Nowis — Simon Morin</p>
        </div>
      </main>
    </div>
  );
}
