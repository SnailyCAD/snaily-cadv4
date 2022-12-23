import type { REGISTER_SCHEMA } from "@snailycad/schemas";
import process from "node:process";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { request } from "undici";
import type { z } from "zod";

const GOOGLE_CAPTCHA_SECRET = process.env.GOOGLE_CAPTCHA_SECRET;
const GOOGLE_CAPTCHA_URL = "https://www.google.com/recaptcha/api/siteverify";
interface PartialGoogleCaptchaResponse {
  success: boolean;
  score: number;
}

export async function validateGoogleCaptcha(data: z.infer<typeof REGISTER_SCHEMA>) {
  const hasGoogleCaptchaSecret =
    typeof GOOGLE_CAPTCHA_SECRET === "string" && GOOGLE_CAPTCHA_SECRET.length > 0;

  if (hasGoogleCaptchaSecret) {
    if (!data.captchaResult) {
      throw new ExtendedBadRequest({ username: "captchaRequired" });
    }

    const googleCaptchaAPIResponse = await request(GOOGLE_CAPTCHA_URL, {
      query: {
        secret: GOOGLE_CAPTCHA_SECRET,
        response: data.captchaResult,
      },
    });

    const googleCaptchaJSON =
      (await googleCaptchaAPIResponse.body.json()) as PartialGoogleCaptchaResponse;
    if (googleCaptchaJSON.score <= 0 || !googleCaptchaJSON.success) {
      throw new ExtendedBadRequest({ username: "invalidCaptcha" });
    }
  }
}
