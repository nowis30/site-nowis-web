export type ClientMediaKind = 'audio' | 'video' | 'unsupported';

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.aac', '.ogg'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

function hasExtension(value: string, extensions: readonly string[]) {
  const normalized = value.toLowerCase();
  return extensions.some((ext) => normalized.endsWith(ext));
}

export function resolveClientMediaKind(params: { mimeType?: string | null; originalName?: string | null }): ClientMediaKind {
  const mimeType = (params.mimeType || '').toLowerCase();
  const originalName = params.originalName || '';

  if (mimeType.startsWith('audio/') || hasExtension(originalName, AUDIO_EXTENSIONS)) {
    return 'audio';
  }

  if (mimeType.startsWith('video/') || hasExtension(originalName, VIDEO_EXTENSIONS)) {
    return 'video';
  }

  return 'unsupported';
}
