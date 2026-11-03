/**
 * oauth redirects (`app.graysky:/auth/callback?...`) are picked up by
 * expo-web-browser to finish signing in. on android they also arrive as a
 * regular deep link, so tell the router to ignore them rather than showing a
 * "not found" screen
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  if (path.includes("auth/callback")) {
    return null;
  }
  return path;
}
