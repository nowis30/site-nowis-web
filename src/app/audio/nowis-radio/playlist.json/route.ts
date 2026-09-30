import tracks from '@/data/radio-tracks.json';

export const dynamic = 'force-dynamic';

/** Keep older open players on the same complete catalogue as the current radio. */
export function GET() {
  return Response.json(tracks.map(({ title, src }) => ({
    title,
    // The old player always resolves filenames below /audio/nowis-radio/.
    // next.config.js maps these UUID aliases to the correct audio objects.
    src: src.replace('/nowis-radio-suno/', '/nowis-radio/'),
  })), { headers: { 'Cache-Control': 'no-store' } });
}
