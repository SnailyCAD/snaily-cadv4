import type { User } from "@prisma/client";
import process from "node:process";
import { authenticator } from "otplib";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { ContentType, Delete, Description, Post } from "@tsed/schema";
import { compareSync } from "bcrypt";
import qrcode from "qrcode";
import { prisma } from "lib/data/prisma";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { IsAuth } from "middlewares/is-auth";
import { encryptValue } from "lib/auth/crypto";
import { validateUser2FA } from "lib/auth/2fa";
import type * as APITypes from "@snailycad/types/api";

@Controller("/2fa")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class UserTwoFactorAuthenticationController {
  @Post("/verify")
  @Description("Verify a totpCode for the authenticated user's account")
  async verify2FA(
    @Context("user") user: User,
    @BodyParams("totpCode") totpCode: string,
  ): Promise<APITypes.PostVerify2FAData> {
    await validateUser2FA({ userId: user.id, totpCode });

    return true;
  }

  @Post("/enable")
  @Description("Enable two step authentication for the authenticated user")
  async enable2FA(
    @Context("user") user: User,
    @BodyParams("currentPassword") currentPassword: string,
  ): Promise<APITypes.PostEnable2FAData> {
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

    const hashSecret = process.env.ENCRYPTION_TOKEN;
    if (!hashSecret) {
      throw new BadRequest("2FA_NOT_ENABLED");
    }

    await prisma.user2FA.create({
      data: {
        userId: user.id,
        secret: encryptValue(secret, hashSecret),
      },
    });

    const keyUri = authenticator.keyuri(user.username, "SnailyCADv4", secret);
    const dataUri = await qrcode.toDataURL(keyUri);

    return { qrCode: dataUri, totpCode: secret };
  }

  @Delete("/")
  @Description("Disable two step authentication for the authenticated user")
  async disable2FA(
    @Context("user") user: User,
    @BodyParams("currentPassword") currentPassword: string,
  ): Promise<APITypes.DeleteDisable2FAData> {
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
