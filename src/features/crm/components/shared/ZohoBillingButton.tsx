import { ExternalLink } from 'lucide-react';

const ZOHO_URL = process.env.ZOHO_BILLING_URL || 'https://books.zoho.com/';

export function ZohoBillingButton() {
  return (
    <a
      href={ZOHO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
    >
      <ExternalLink size={15} />
      Facturation Zoho
    </a>
  );
}
