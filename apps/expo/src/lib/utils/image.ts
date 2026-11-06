const BSKY_CDN_IMAGE = "https://cdn.bsky.app/img/";
const IMAGE_FORMAT = /@(jpeg|png|webp|gif)$/;

/**
 * the bsky cdn serves urls without a `@format` suffix as webp, which
 * a lot of galleries and share targets don't accept. ask for jpeg instead
 */
export function getDownloadableImageUri(uri: string) {
  if (uri.startsWith(BSKY_CDN_IMAGE) && !IMAGE_FORMAT.test(uri)) {
    return `${uri}@jpeg`;
  }
  return uri;
}

/** the format from a bsky cdn url's `@format` suffix, defaulting to jpeg */
export function getImageFormat(uri: string) {
  return IMAGE_FORMAT.exec(uri)?.[1] ?? "jpeg";
}
