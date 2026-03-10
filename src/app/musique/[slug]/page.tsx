import { redirect } from 'next/navigation';

type PageProps = { params: { slug: string } };

export const dynamic = 'force-dynamic';

export default function MusiqueSongRedirectPage({ params }: PageProps) {
  redirect(`/chanson/${params.slug}`);
}
