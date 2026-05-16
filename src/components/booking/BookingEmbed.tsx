'use client';

function isCalendlyUrl(value: string) {
  return /(^https?:\/\/)?(www\.)?calendly\.com\//i.test(value);
}

export function BookingEmbed({
  url,
  title,
  minHeight = 760,
  className = '',
}: {
  url: string;
  title: string;
  minHeight?: number;
  className?: string;
}) {
  const normalizedClassName = className.trim();

  if (isCalendlyUrl(url)) {
    return (
      <div
        className={normalizedClassName || 'w-full'}
        style={{ minHeight }}
      >
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-700">
            Le calendrier intégré n&apos;est pas disponible dans cet environnement.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Ouvrir le lien de réservation
          </a>
        </div>
      </div>
    );
  }

  const iframeUrl = url.includes('?') ? `${url}&embed=true` : `${url}?embed=true`;

  return (
    <iframe
      title={title}
      src={iframeUrl}
      width="100%"
      height={minHeight + 100}
      frameBorder="0"
      className={normalizedClassName || 'w-full'}
      style={{ minHeight }}
      allow="camera; microphone; clipboard-write"
    />
  );
}