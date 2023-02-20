import type { NextApiResponse, NextApiRequest } from "next";
import nookies from "nookies";

export const IFRAME_COOKIE_NAME = "snaily-cad-iframe-cookie" as const;

/**
 * store cookies on the server-side to support Iframes in a non-secure environment.
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;
  const body = typeof req.body === "string" ? req.body : String(req.body);

  if (method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  if (!body) {
    throw new Error("body required");
  }

  nookies.set({ res }, IFRAME_COOKIE_NAME, body, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000 * 5),
  });

  return res.status(200).send("OK");
}
