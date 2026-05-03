import { redirect } from 'next/navigation';

export default function PayerAtelierRedirectPage({ params }: { params: { token: string } }) {
  redirect(`/facture/${encodeURIComponent(params.token)}`);
}
