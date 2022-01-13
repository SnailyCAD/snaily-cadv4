import { Response } from "@tsed/common";
import { serialize } from "cookie";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
}

export function setCookie(options: SetCookieOptions) {
  options.res.setHeader(
    "Set-Cookie",
    serialize(options.name, options.value, {
      httpOnly: true,
      expires: new Date(Date.now() + options.expires),
      path: "/",
      domain: process.env.DOMAIN || undefined,
    }),
  );
}
