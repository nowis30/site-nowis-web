import { redirect } from 'next/navigation';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export default async function MusiqueSongRedirectPage(props: PageProps) {
  const params = await props.params;
  redirect(`/chanson/${params.slug}`);
}
