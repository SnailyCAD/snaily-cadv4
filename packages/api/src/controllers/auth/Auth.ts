import process from "node:process";
import { User, WhitelistStatus, Rank } from ".prisma/client";
import { Controller, BodyParams, Post, Res, Response } from "@tsed/common";
import { hashSync, genSaltSync, compareSync } from "bcrypt";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { setCookie } from "utils/setCookie";
import { signJWT } from "utils/jwt";
import { Cookie } from "@snailycad/config";
import { findOrCreateCAD } from "lib/cad";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { validateUser2FA } from "lib/auth/2fa";
import { Description, Returns } from "@tsed/schema";
import { Feature } from "@prisma/client";

// expire after 5 hours
export const AUTH_TOKEN_EXPIRES_MS = 60 * 60 * 1000 * 5;
export const AUTH_TOKEN_EXPIRES_S = AUTH_TOKEN_EXPIRES_MS / 1000;

@Controller("/auth")
export class AuthController {
  @Post("/login")
  @Description("Authenticate a user via username and password")
  @Returns(200)
  @Returns(400, ExtendedBadRequest)
  @Returns(404, ExtendedNotFound)
  async login(@BodyParams() body: unknown, @Res() res: Response) {
    const data = validateSchema(AUTH_SCHEMA, body);

    const user = await prisma.user.findUnique({
      where: {
        username: data.username,
      },
    });

    if (!user) {
      throw new ExtendedNotFound({ username: "userNotFound" });
    }

    if (user.whitelistStatus === WhitelistStatus.PENDING) {
      throw new BadRequest("whitelistPending");
    }

    if (user.whitelistStatus === WhitelistStatus.DECLINED) {
      throw new BadRequest("whitelistDeclined");
    }

    if (user.banned) {
      throw new BadRequest("userBanned");
    }

    // only allow Discord auth (if enabled)
    const cad = await prisma.cad.findFirst();
    if (cad?.disabledFeatures.includes(Feature.ALLOW_REGULAR_LOGIN)) {
      throw new BadRequest("allowRegularLoginIsDisabled");
    }

    const userPassword = user.tempPassword ?? user.password;
    const isPasswordCorrect = compareSync(data.password, userPassword);
    if (!isPasswordCorrect) {
      throw new ExtendedBadRequest({ password: "passwordIncorrect" });
    }

    await validateUser2FA({
      totpCode: data.totpCode ?? null,
      userId: user.id,
      throwOnNotEnabled: false,
    });

    const jwtToken = signJWT({ userId: user.id }, AUTH_TOKEN_EXPIRES_S);
    setCookie({
      res,
      name: Cookie.Session,
      expires: AUTH_TOKEN_EXPIRES_MS,
      value: jwtToken,
    });

    if (user.tempPassword) {
      return res.json({ hasTempPassword: true });
    }

    if (process.env.IFRAME_SUPPORT_ENABLED === "true") {
      return res.json({ userId: user.id, session: jwtToken });
    }

    return res.json({ userId: user.id });
  }

  @Post("/register")
  @Description("Create a user via username and password")
  @Returns(200)
  @Returns(400, ExtendedBadRequest)
  async register(@BodyParams() body: unknown, @Res() res: Response) {
    const data = validateSchema(AUTH_SCHEMA, body);

    const existing = await prisma.user.findUnique({
      where: {
        username: data.username,
      },
    });

    if (existing) {
      throw new ExtendedBadRequest({ username: "userAlreadyExists" });
    }

    const preCad = await prisma.cad.findFirst({
      select: { disabledFeatures: true, registrationCode: true },
    });
    if (preCad?.registrationCode) {
      const code = data.registrationCode;
      if (code !== preCad.registrationCode) {
        throw new ExtendedBadRequest({ registrationCode: "invalidRegistrationCode" });
      }
    }

    // only allow Discord auth
    if (preCad?.disabledFeatures.includes(Feature.ALLOW_REGULAR_LOGIN)) {
      throw new BadRequest("allowRegularLoginIsDisabled");
    }

    const userCount = await prisma.user.count();
    const salt = genSaltSync();

    const password = hashSync(data.password, salt);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password,
      },
    });

    const cad = await findOrCreateCAD({
      ownerId: user.id,
    });

    const autoSetUserProperties = cad.autoSetUserProperties;
    const extraUserData: Partial<User> =
      userCount <= 0
        ? {
            rank: Rank.OWNER,
            isDispatch: true,
            isLeo: true,
            isEmsFd: true,
            isSupervisor: true,
            isTow: true,
            isTaxi: true,
            whitelistStatus: WhitelistStatus.ACCEPTED,
          }
        : {
            isTow: !cad.towWhitelisted,
            isTaxi: !cad.taxiWhitelisted,
            rank: Rank.USER,
            whitelistStatus: cad.whitelisted ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
            isDispatch: autoSetUserProperties?.dispatch ?? false,
            isEmsFd: autoSetUserProperties?.emsFd ?? false,
            isLeo: autoSetUserProperties?.leo ?? false,
          };

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: extraUserData,
    });

    if (extraUserData.rank === Rank.USER && cad.whitelisted) {
      throw new BadRequest("whitelistPending");
    }

    const jwtToken = signJWT({ userId: user.id }, AUTH_TOKEN_EXPIRES_S);
    setCookie({
      res,
      name: Cookie.Session,
      expires: AUTH_TOKEN_EXPIRES_MS,
      value: jwtToken,
    });

    if (process.env.IFRAME_SUPPORT_ENABLED === "true") {
      return res.json({
        userId: user.id,
        session: jwtToken,
        isOwner: extraUserData.rank === Rank.OWNER,
      });
    }

    return { userId: user.id, isOwner: extraUserData.rank === Rank.OWNER };
  }
}
