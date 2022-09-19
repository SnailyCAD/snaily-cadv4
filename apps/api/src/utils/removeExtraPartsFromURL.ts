export function removeExtraPartsFromURL(url: string) {
  const { origin } = new URL(url);
  return origin;
}
