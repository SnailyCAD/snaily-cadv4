import process from "node:process";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { authenticator } from "otplib";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { decryptValue } from "./crypto";

interface Options {
  userId: string;
  totpCode: string | null;
  throwOnNotEnabled?: boolean;
}

export async function validateUser2FA(options: Options) {
  const user2FA = await prisma.user2FA.findFirst({
    where: { userId: options.userId },
  });

  if (!user2FA) {
    if (options.throwOnNotEnabled) {
      throw new ExtendedBadRequest({ totpCode: "user2FANotEnabled" });
    }

    return;
  }

  if (!options.totpCode) {
    throw new ExtendedBadRequest({ totpCode: "totpCodeRequired" }, "totpCodeRequired");
  }

  const hashSecret = process.env.ENCRYPTION_TOKEN;
  if (!hashSecret) {
    throw new BadRequest("2FA_NOT_ENABLED");
  }

  const secret = decryptValue(user2FA.secret, hashSecret);
  const isValidCode = authenticator.check(options.totpCode, secret);
  if (!isValidCode) {
    throw new ExtendedBadRequest({ totpCode: "invalidTotpCode" });
  }
}
