import { shuffleTracks } from './radio-shuffle';

export type PlaySelectionOptions = { startId?: string; label?: string };

/** Keep the full selection for repeat, and start its first pass at the requested song. */
export function buildSelectionQueue(
  catalog: ReadonlyArray<{ id: string }>, ids: string[], startId?: string,
) {
  const byId = new Map(catalog.map((track, index) => [track.id, index]));
  const selection = [...new Set(ids)].flatMap(id => {
    const index = byId.get(id);
    return index === undefined ? [] : [index];
  });
  const selectedStart = startId ? byId.get(startId) : undefined;
  const position = selectedStart === undefined ? -1 : selection.indexOf(selectedStart);
  return { selection, queue: selection.slice(Math.max(0, position)) };
}

/** Album-only recordings never enter the public radio's random rotation. */
export function buildRadioQueue(radioLength: number, current: number) {
  return shuffleTracks(radioLength, current < radioLength ? current : -1);
}
