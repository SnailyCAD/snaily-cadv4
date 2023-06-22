import { FastifyReply } from "fastify";
import { setCookie } from "utils/set-cookie";

interface Options {
  res: FastifyReply;
  locale: string | null;
  isDarkTheme: boolean;
}

export function setUserPreferencesCookies(options: Options) {
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  setCookie({
    name: "sn_locale",
    res: options.res,
    value: options.locale ?? "",
    expires: options.locale ? ONE_YEAR_MS : 0,
    httpOnly: false,
  });
  setCookie({
    name: "sn_isDarkTheme",
    res: options.res,
    value: String(options.isDarkTheme),
    expires: ONE_YEAR_MS,
    httpOnly: false,
  });
}
