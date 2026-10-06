// CSP nonces require rendering private HTML for each request.
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CrmRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
