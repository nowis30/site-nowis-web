/** Fisher–Yates shuffle. Avoid repeating the last song at a cycle boundary. */
export function shuffleTracks(length: number, previous = -1, random = Math.random): number[] {
  const result = Array.from({ length }, (_, index) => index);
  for (let index = length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  if (length > 1 && result[0] === previous) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}
