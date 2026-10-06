import { redirect } from 'next/navigation';

export default async function PayerChansonRedirectPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  redirect(`/facture/${encodeURIComponent(params.token)}`);
}
