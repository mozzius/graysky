/**
 * split an array into chunks of at most `size`. for array query params (e.g.
 * `getPosts` takes at most 25 uris), and so the url doesn't get too long
 */
export function chunk<T>(items: readonly T[], size = 25): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
