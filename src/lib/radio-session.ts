export const RADIO_SESSION_KEY = 'nowis-radio-session-v1';

export type RadioSession = {
  catalog: string;
  queue: number[];
  current: number;
  position: number;
  selection?: number[];
};

/** Ignore old catalogues and malformed storage without preventing playback. */
export function parseRadioSession(raw: string | null, catalog: string, length: number): RadioSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as RadioSession;
    const validIndex = (index: number) => Number.isInteger(index) && index >= 0 && index < length;
    if (value.catalog !== catalog || !validIndex(value.current) || !Array.isArray(value.queue)
      || !value.queue.every(validIndex) || new Set(value.queue).size !== value.queue.length
      || value.queue.includes(value.current) || !Number.isFinite(value.position) || value.position < 0) return null;
    if (value.selection !== undefined && (!Array.isArray(value.selection) || !value.selection.length
      || !value.selection.every(validIndex) || new Set(value.selection).size !== value.selection.length
      || !value.selection.includes(value.current) || !value.queue.every(index => value.selection!.includes(index)))) return null;
    return value;
  } catch {
    return null;
  }
}
