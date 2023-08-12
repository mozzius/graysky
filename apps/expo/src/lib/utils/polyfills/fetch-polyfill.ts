/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { jsonToLex, stringifyLex } from "@atproto/api";
import mime from "mime";

const GET_TIMEOUT = 15e3; // 15s
const POST_TIMEOUT = 60e3; // 60s

interface FetchHandlerResponse {
  status: number;
  headers: Record<string, string>;
  body: ArrayBuffer | undefined;
}

export async function fetchHandler(
  reqUri: string,
  reqMethod: string,
  reqHeaders: Record<string, string>,
  reqBody: any,
): Promise<FetchHandlerResponse> {
  const reqMimeType = reqHeaders["Content-Type"] || reqHeaders["content-type"];
  if (reqMimeType && reqMimeType.startsWith("application/json")) {
    reqBody = stringifyLex(reqBody);
  } else if (
    typeof reqBody === "string" &&
    (reqBody.startsWith("/") || reqBody.startsWith("file:"))
  ) {
    const name = reqBody.split("/").pop();
    const type = mime.getType(name!);
    if (type === "image/jpeg") {
      // HACK
      // React native has a bug that inflates the size of jpegs on upload
      // we get around that by renaming the file ext to .bin
      // see https://github.com/facebook/react-native/issues/27099
      // -prf
      const newPath = reqBody.replace(/\.(jpe?g)$/, ".bin");
      await FileSystem.moveAsync({ from: reqBody, to: newPath });
      reqBody = newPath;
    }

    await Platform.select({
      default: async () => {
        // React native treats bodies with {uri: string} as file uploads to pull from cache
        reqBody = { uri: reqBody };
        return Promise.resolve();
      },
      android: async () => {
        // ...except for android, so fetch as a blob
        const res = await fetch(reqBody as string);
        reqBody = await res.blob();
      },
    })();
  }

  const controller = new AbortController();
  const to = setTimeout(
    () => controller.abort(),
    reqMethod === "post" ? POST_TIMEOUT : GET_TIMEOUT,
  );

  const res = await fetch(reqUri, {
    method: reqMethod,
    headers: reqHeaders,
    body: reqBody,
    signal: controller.signal,
  });

  const resStatus = res.status;
  const resHeaders: Record<string, string> = {};
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value;
  });
  const resMimeType = resHeaders["Content-Type"] || resHeaders["content-type"];
  let resBody;
  if (resMimeType) {
    if (resMimeType.startsWith("application/json")) {
      resBody = jsonToLex(await res.json());
    } else if (resMimeType.startsWith("text/")) {
      resBody = await res.text();
    } else {
      throw new Error("TODO: non-textual response body");
    }
  }

  clearTimeout(to);

  return {
    status: resStatus,
    headers: resHeaders,
    body: resBody as any,
  };
}
