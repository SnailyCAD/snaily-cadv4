import process from "node:process";
import type { Response } from "@tsed/common";
import { CookieSerializeOptions, serialize } from "cookie";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
}

export function setCookie(options: SetCookieOptions) {
  let extraOptions: CookieSerializeOptions = {};

  if (process.env.SECURE_COOKIES_FOR_IFRAME === "true") {
    extraOptions = {
      secure: true,
      sameSite: "none",
    };
  }

  /**
   * dotenv parses "" (empty string) weirdly.
   */
  // eslint-disable-next-line quotes
  if (process.env.DOMAIN?.replace('""', "")?.trim()) {
    extraOptions.domain = process.env.DOMAIN;
  }

  options.res.setHeader(
    "Set-Cookie",
    serialize(options.name, options.value, {
      httpOnly: true,
      expires: new Date(Date.now() + options.expires),
      path: "/",
      ...extraOptions,
    }),
  );
}
