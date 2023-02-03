export function parseCORSOrigin(origin: string) {
  if (origin === "*") return origin;

  try {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return origin;
  }
}
