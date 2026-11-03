import * as FileSystem from "expo-file-system/legacy";
import { type BlobRef, type Client } from "@atproto/lex";

/**
 * upload a blob to the user's PDS
 *
 * @param encoding Allows overriding the blob's type
 * @returns the uploaded blob ref, to be used in a record
 */
export async function uploadBlob(
  agent: Client,
  input: string | Blob,
  encoding?: `${string}/${string}`,
): Promise<BlobRef> {
  const upload = async (blob: Blob) => {
    const res = await agent.uploadBlob(blob, { encoding });
    return res.body.blob;
  };

  if (typeof input === "string" && input.startsWith("file:")) {
    const blob = await asBlob(input);
    return upload(blob);
  }

  if (typeof input === "string" && input.startsWith("/")) {
    const blob = await asBlob(`file://${input}`);
    return upload(blob);
  }

  if (typeof input === "string" && input.startsWith("data:")) {
    const blob = await fetch(input).then((r) => r.blob());
    return upload(blob);
  }

  if (input instanceof Blob) {
    return upload(input);
  }

  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`);
}

async function asBlob(uri: string): Promise<Blob> {
  return withSafeFile(uri, async (safeUri) => {
    // Note
    // Android does not support `fetch()` on `file://` URIs. for this reason, we
    // use XMLHttpRequest instead of simply calling:

    // return fetch(safeUri.replace('file:///', 'file:/')).then(r => r.blob())

    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.onerror = () => reject(new Error("Failed to load blob"));
      xhr.responseType = "blob";
      xhr.open("GET", safeUri, true);
      xhr.send(null);
    });
  });
}

// HACK
// React native has a bug that inflates the size of jpegs on upload
// we get around that by renaming the file ext to .bin
// see https://github.com/facebook/react-native/issues/27099
// -prf
async function withSafeFile<T>(
  uri: string,
  fn: (path: string) => Promise<T>,
): Promise<T> {
  if (uri.endsWith(".jpeg") || uri.endsWith(".jpg")) {
    // Since we don't "own" the file, we should avoid renaming or modifying it.
    // Instead, let's copy it to a temporary file and use that (then remove the
    // temporary file).
    const newPath = uri.replace(/\.jpe?g$/, ".bin");
    try {
      // await RNFS.copyFile(uri, newPath);
      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      });
    } catch {
      // Failed to copy the file, just use the original
      return await fn(uri);
    }
    try {
      return await fn(newPath);
    } finally {
      // Remove the temporary file
      // await RNFS.unlink(newPath);
      await FileSystem.deleteAsync(newPath).catch(() => {});
    }
  } else {
    return fn(uri);
  }
}
