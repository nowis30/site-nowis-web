import { getAllSongs } from '@/data/songs';
import { getYouTubeThumbnailUrl } from '@/lib/seo';

export type VideoItem = {
  title: string;
  slug: string;
  image: string;
  youtubeUrl: string;
  shortDescription: string;
  category: string;
  featured?: boolean;
};

const manualVideos: VideoItem[] = [];

export async function getAllVideos(): Promise<VideoItem[]> {
  const songs = await getAllSongs();
  const songVideos: VideoItem[] = songs
    .filter((song) => song.youtubeUrl)
    .map((song, index) => ({
      title: song.title,
      slug: song.slug,
      image: getYouTubeThumbnailUrl(song.youtubeUrl, 'hqdefault') || song.image,
      youtubeUrl: song.youtubeUrl!,
      shortDescription: song.shortDescription,
      category: 'Clip musical',
      featured: index < 3,
    }));

  return [...manualVideos, ...songVideos];
}
