export function parseCORSOrigin(origin: string) {
  if (origin === "*") return origin;

  try {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return origin;
  }
}

const SECURE_COOKIES_FOR_IFRAME = process.env.SECURE_COOKIES_FOR_IFRAME === "true";
const NEXT_PUBLIC_PROD_ORIGIN = process.env.NEXT_PUBLIC_PROD_ORIGIN;
const NEXT_PUBLIC_CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || process.env.CORS_ORIGIN_URL;

export function canSecureCookiesBeEnabled() {
  if (!SECURE_COOKIES_FOR_IFRAME) return undefined;

  /**
   * dotenv parses "" (empty string) weirdly.
   */
  // eslint-disable-next-line quotes
  const parsedEnvDomain = process.env.DOMAIN?.replace('""', "");
  if (!parsedEnvDomain) return undefined;

  const clientURL = tryAndMakeURL(NEXT_PUBLIC_CLIENT_URL);
  const prodOrigin = tryAndMakeURL(NEXT_PUBLIC_PROD_ORIGIN);

  return clientURL?.protocol === "https:" && prodOrigin?.protocol === "https:";
}

function tryAndMakeURL(url: string | undefined) {
  try {
    return new URL(String(url));
  } catch {
    return null;
  }
}

export function getEnvironmentVariableDOMAIN() {
  let domain;

  if (canSecureCookiesBeEnabled() === false) {
    return undefined;
  }

  /**
   * dotenv parses "" (empty string) weirdly.
   */
  // eslint-disable-next-line quotes
  const parsedEnvDomain = process.env.DOMAIN?.replace('""', "");
  if (parsedEnvDomain?.trim()) {
    domain = process.env.DOMAIN;
  }

  return domain;
}
