'use client';

import Script from 'next/script';

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
      <>
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />
        <div
          className={normalizedClassName || undefined}
          style={{ minWidth: 320, height: minHeight }}
        >
          <div
            className="calendly-inline-widget h-full w-full"
            data-url={url}
            style={{ minWidth: 320, height: minHeight }}
          />
        </div>
      </>
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