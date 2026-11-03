import { type AtUriString, type DidString } from "@atproto/lex";

export const getDidFromUri = (uri: string) => {
  const uriParts = uri.split("/");
  return uriParts[2]! as DidString;
};

// at://<host>/<collection>/<rkey>
export const parseUri = (uri: AtUriString) => {
  const [host, collection, rkey] = uri.slice("at://".length).split("/");
  return { host: host!, collection, rkey };
};
