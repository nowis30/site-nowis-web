export class FileContentTypeError extends Error {
  constructor() { super('Le contenu du fichier ne correspond pas au format déclaré.'); }
}
/** Type consistency only. This does not replace malware scanning or document sanitization. */
export function assertFileContentSignature(prefix: Uint8Array, mimeType: string) {
  const bytes = Buffer.from(prefix);
  const starts = (magic: number[]) => magic.every((byte, index) => bytes[index] === byte);
  const text = (start: number, end: number) => bytes.subarray(start, end).toString('ascii');
  let valid = false;
  switch (mimeType.toLowerCase()) {
    case 'application/pdf': valid = text(0, 5) === '%PDF-'; break;
    case 'image/png': valid = starts([137, 80, 78, 71, 13, 10, 26, 10]); break;
    case 'image/jpeg': valid = starts([255, 216, 255]); break;
    case 'image/webp': valid = text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP'; break;
    case 'audio/wav': case 'audio/x-wav': valid = ['RIFF', 'RF64'].includes(text(0, 4)) && text(8, 12) === 'WAVE'; break;
    case 'audio/mpeg': valid = text(0, 3) === 'ID3' || (bytes.length >= 4 && bytes[0] === 255 && (bytes[1] & 224) === 224 && (bytes[1] & 6) !== 0 && (bytes[2] & 240) !== 0 && (bytes[2] & 240) !== 240); break;
    case 'audio/mp4': case 'audio/x-m4a': case 'video/mp4': valid = bytes.length >= 12 && text(4, 8) === 'ftyp'; break;
    case 'application/msword': valid = starts([208, 207, 17, 224, 161, 177, 26, 225]); break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': valid = starts([80, 75, 3, 4]); break;
    case 'text/plain':
      try {
        new TextDecoder('utf-8', { fatal: true }).decode(bytes, { stream: true });
        valid = bytes.length > 0 && !bytes.some(byte => byte === 0 || (byte < 32 && ![9, 10, 13].includes(byte)));
      } catch { valid = false; }
      break;
  }
  if (!valid) throw new FileContentTypeError();
}
