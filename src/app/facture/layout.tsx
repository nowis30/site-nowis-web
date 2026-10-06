// CSP nonces require rendering private HTML for each request.
export const dynamic = 'force-dynamic';
export default function PrivateLayout({ children }: { children: React.ReactNode }) { return children; }
