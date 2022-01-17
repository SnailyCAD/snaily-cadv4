import { Response } from "@tsed/common";
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

  options.res.setHeader(
    "Set-Cookie",
    serialize(options.name, options.value, {
      httpOnly: true,
      expires: new Date(Date.now() + options.expires),
      path: "/",
      domain: process.env.DOMAIN ?? undefined,
      ...extraOptions,
    }),
  );
}
