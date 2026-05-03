import { redirect } from 'next/navigation';

export default function PayerChansonRedirectPage({ params }: { params: { token: string } }) {
  redirect(`/facture/${encodeURIComponent(params.token)}`);
}
