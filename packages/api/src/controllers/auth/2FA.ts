import type { User } from "@prisma/client";
import { authenticator } from "otplib";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { Delete, Post } from "@tsed/schema";
import { compareSync } from "bcrypt";
import qrcode from "qrcode";
import { prisma } from "lib/prisma";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { IsAuth } from "middlewares/IsAuth";
import { decryptValue, encryptValue } from "lib/auth/crypto";

// todo
const hashSecret = "3a50b2f71edf526c561ef3be974fac49";

@Controller("/2fa")
@UseBeforeEach(IsAuth)
export class User2FA {
  @Post("/verify")
  async verify2FA(@Context("user") user: User, @BodyParams("totpCode") totpCode: string) {
    const user2FA = await prisma.user2FA.findFirst({
      where: { userId: user.id },
    });

    if (!user2FA) {
      throw new ExtendedBadRequest({ totpCode: "user2FANotEnabled" });
    }

    const secret = decryptValue(user2FA.secret, hashSecret);
    const isValidCode = authenticator.check(totpCode, secret);
    if (!isValidCode) {
      throw new ExtendedBadRequest({ totpCode: "invalidTotpCode" });
    }

    return true;
  }

  @Post("/enable")
  async enable2FA(
    @Context("user") user: User,
    @BodyParams("currentPassword") currentPassword: string,
  ) {
    const u = (await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })) as Pick<User, "password">;

    const user2FA = await prisma.user2FA.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (user2FA) {
      throw new BadRequest("user2FAAlreadyEnabled");
    }

    const isCurrentPasswordCorrect = currentPassword && compareSync(currentPassword, u.password);
    if (!currentPassword || !isCurrentPasswordCorrect) {
      throw new ExtendedBadRequest({ currentPassword: "currentPasswordIncorrect" });
    }

    const secret = authenticator.generateSecret(20);

    await prisma.user2FA.create({
      data: {
        userId: user.id,
        secret: encryptValue(secret, hashSecret),
      },
    });

    const keyUri = authenticator.keyuri(user.username, "SnailyCADv4", secret);
    const dataUri = await qrcode.toDataURL(keyUri);

    return dataUri;
  }

  @Delete()
  async disable2FA(
    @Context("user") user: User,
    @BodyParams("currentPassword") currentPassword: string,
  ) {
    const u = (await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })) as Pick<User, "password">;

    const user2FA = await prisma.user2FA.findFirst({
      where: { userId: user.id },
    });

    if (!user2FA) {
      throw new BadRequest("noUser2FA");
    }

    const isCurrentPasswordCorrect = compareSync(currentPassword, u.password);
    if (!isCurrentPasswordCorrect) {
      throw new ExtendedBadRequest({ currentPassword: "currentPasswordIncorrect" });
    }

    await prisma.user2FA.delete({
      where: { id: user2FA.id },
    });

    return true;
  }
}
