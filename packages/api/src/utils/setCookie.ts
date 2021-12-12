import { Response } from "@tsed/common";
import { serialize } from "cookie";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
}

export function setCookie(options: SetCookieOptions) {
  let serializeOptions = {};

  // this will break the CAD if you're not using https!
  if (process.env.EXPERIMENTAL_SECURE_CONTEXT) {
    serializeOptions = {
      sameSite: "none",
      secure: true,
    };
  }

  options.res.setHeader(
    "Set-Cookie",
    serialize(options.name, options.value, {
      httpOnly: true,
      expires: new Date(Date.now() + options.expires),
      path: "/",
      ...serializeOptions,
    }),
  );
}
