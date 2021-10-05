import { Response } from "@tsed/common";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
}

export function setCookie(options: SetCookieOptions) {
  options.res.cookie(options.name, options.value, {
    httpOnly: true,
    path: "/",
    expires: new Date(Date.now() + options.expires),
  });
}
