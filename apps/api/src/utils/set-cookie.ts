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

function getURL(url: string | undefined, returnNull: false): URL | null;
function getURL(url: string | undefined, returnNull: true): string | URL | null;
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
  const clientURL = getURL(
    process.env.NEXT_PUBLIC_CLIENT_URL || process.env.CORS_ORIGIN_URL,
    false,
  );
  const apiURL = getURL(process.env.NEXT_PUBLIC_PROD_ORIGIN, false);

  return clientURL?.protocol === "https:" && apiURL?.protocol === "https:";
}

export function setCookie(options: SetCookieOptions) {
  let extraOptions: CookieSerializeOptions = {};
  const domain = process.env.DOMAIN?.trim();
  const url = getURL(domain, true);
  const hostname = typeof url === "string" ? url : url?.hostname;

  const isAnIP = hostname && isIP(hostname);

  console.log({ isAnIP, domain, url });

  if (url && !isAnIP) {
    extraOptions.domain = domain;

    /**
     * set the secure context to true if the client and API are using https.
     */
    const enableSecureContext = canSecureContextBeEnabled();
    console.log({ enableSecureContext });

    if (enableSecureContext) {
      extraOptions = {
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
        secure: true,
        sameSite: "none",
      };
    }
  }

  console.log({ extraOptions });

  options.res.cookie(options.name, options.value, {
    httpOnly: options.httpOnly ?? true,
    expires: new Date(Date.now() + options.expires),
    path: "/",
    ...extraOptions,
  });
}
