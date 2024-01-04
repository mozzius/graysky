export const getDidFromUri = (uri: string): string => {
  const uriParts = uri.split("/");
  return uriParts[2]!;
};
