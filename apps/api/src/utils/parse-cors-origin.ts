export function parseCORSOrigin(origin: string) {
  const parsed = new URL(origin);
  return `${parsed.protocol}//${parsed.host}`;
}
