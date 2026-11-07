'use client';

import { encode } from 'uqr';

export function QrCode({ value }: { value: string }) {
  const qr = encode(value, { ecc: 'M', border: 2 });
  let path = '';
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (qr.data[y]?.[x]) path += `M${x} ${y}h1v1h-1z`;
    }
  }

  return (
    <svg viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label="Code QR pour rejoindre la salle" className="h-full w-full">
      <rect width={qr.size} height={qr.size} fill="#ffffff" />
      <path d={path} fill="#111111" />
    </svg>
  );
}
