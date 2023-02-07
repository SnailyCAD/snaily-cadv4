import type { Response } from "@tsed/common";
import type { CookieSerializeOptions } from "cookie";
import {
  canSecureCookiesBeEnabled,
  getEnvironmentVariableDOMAIN,
} from "./validate-environment-variables";

interface SetCookieOptions {
  name: string;
  value: string;
  res: Response;
  expires: number;
  httpOnly?: boolean;
}

export function setCookie(options: SetCookieOptions) {
  let extraOptions: CookieSerializeOptions = {};

  if (canSecureCookiesBeEnabled()) {
    extraOptions = {
      secure: true,
      sameSite: "none",
    };
  }

  const domain = getEnvironmentVariableDOMAIN();
  if (domain) {
    extraOptions.domain = domain;
  }

  options.res.cookie(options.name, options.value, {
    httpOnly: options.httpOnly ?? true,
    expires: new Date(Date.now() + options.expires),
    path: "/",
    ...extraOptions,
  });
}
