import type { Response } from "@tsed/common";
import type { CookieSerializeOptions } from "cookie";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
  httpOnly?: boolean;
}

function getURL(url: string | undefined) {
  try {
    if (!url) return null;
    return new URL(url);
  } catch {
    return null;
  }
}

function canSecureContextBeEnabled() {
  const clientURL = getURL(process.env.NEXT_PUBLIC_CLIENT_URL || process.env.CORS_ORIGIN_URL);
  const apiURL = getURL(process.env.NEXT_PUBLIC_PROD_ORIGIN);

  return clientURL?.protocol === "https:" && apiURL?.protocol === "https:";
}

export function setCookie(options: SetCookieOptions) {
  let extraOptions: CookieSerializeOptions = {};

  if (process.env.DOMAIN?.trim()) {
    extraOptions.domain = process.env.DOMAIN;

    /**
     * set the secure context to true if the client and API are using https.
     */
    const enableSecureContext = canSecureContextBeEnabled();
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

  options.res.cookie(options.name, options.value, {
    httpOnly: options.httpOnly ?? true,
    expires: new Date(Date.now() + options.expires),
    path: "/",
    ...extraOptions,
  });
}
