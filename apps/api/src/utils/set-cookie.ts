import type { Response } from "@tsed/common";
import type { CookieSerializeOptions } from "cookie";
import isIP from "is-ip";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
  httpOnly?: boolean;
}

function getURL(url: string | undefined, returnNull: false): string | URL | null;
function getURL(url: string | undefined, returnNull: true): URL | null;
function getURL(url: string | undefined, returnNull: boolean) {
  try {
    if (!url) {
      if (returnNull) return null;
      return url;
    }
    return new URL(url);
  } catch {
    if (returnNull) return null;
    return url;
  }
}

function canSecureContextBeEnabled() {
  const clientURL = getURL(process.env.NEXT_PUBLIC_CLIENT_URL || process.env.CORS_ORIGIN_URL, true);
  const apiURL = getURL(process.env.NEXT_PUBLIC_PROD_ORIGIN, true);

  return clientURL?.protocol === "https:" && apiURL?.protocol === "https:";
}

export function setCookie(options: SetCookieOptions) {
  let extraOptions: CookieSerializeOptions = {};
  const domain = process.env.DOMAIN?.trim();
  const url = getURL(domain, false);
  const hostname = typeof url === "string" ? url : url?.hostname;

  const isAnIP = hostname && isIP(hostname);

  if (!isAnIP) {
    extraOptions.domain = hostname;

    /**
     * set the secure context to true if the client and API are using https.
     */
    const enableSecureContext = canSecureContextBeEnabled();
    if (enableSecureContext) {
      extraOptions = {
        ...extraOptions,
        secure: true,
        sameSite: "lax",
      };
    }

    /**
     * if the client and API are using https, we can enable the secure context
     * and set the sameSite to none. This will allow the cookie to be sent to the api from the
     * client when the client is loaded in an iframe.
     */
    if (process.env.SECURE_COOKIES_FOR_IFRAME === "true" && canSecureContextBeEnabled()) {
      extraOptions = {
        ...extraOptions,
        secure: true,
        sameSite: "none",
      };
    }
  }

  options.res.cookie(options.name, options.value, {
    httpOnly: options.httpOnly ?? true,
    expires: new Date(Date.now() + options.expires),
    path: "/",
    ...extraOptions,
  });
}
