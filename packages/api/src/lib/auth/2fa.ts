import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { authenticator } from "otplib";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { decryptValue } from "./crypto";

const hashSecret = "3a50b2f71edf526c561ef3be974fac49";

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
    throw new BadRequest("totpCodeRequired");
  }

  const secret = decryptValue(user2FA.secret, hashSecret);
  const isValidCode = authenticator.check(options.totpCode, secret);
  if (!isValidCode) {
    throw new ExtendedBadRequest({ totpCode: "invalidTotpCode" });
  }
}
