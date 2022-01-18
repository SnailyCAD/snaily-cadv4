import process from "node:process";
import { User, WhitelistStatus, Rank } from ".prisma/client";
import { Controller, BodyParams, Post, Res, Response } from "@tsed/common";
import { hashSync, genSaltSync, compareSync } from "bcrypt";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { setCookie } from "utils/setCookie";
import { signJWT } from "utils/jwt";
import { Cookie } from "@snailycad/config";
import { findOrCreateCAD } from "lib/cad";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";

// expire after 5 hours
export const AUTH_TOKEN_EXPIRES_MS = 60 * 60 * 1000 * 5;
export const AUTH_TOKEN_EXPIRES_S = AUTH_TOKEN_EXPIRES_MS / 1000;

@Controller("/auth")
export class AuthController {
  @Post("/login")
  async login(@BodyParams() body: unknown, @Res() res: Response) {
    const data = validateSchema(AUTH_SCHEMA, body);

    const user = await prisma.user.findUnique({
      where: {
        username: data.username,
      },
    });

    if (!user) {
      throw new NotFound("userNotFound");
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

    const userPassword = user.tempPassword ?? user.password;
    const isPasswordCorrect = compareSync(data.password, userPassword);
    if (!isPasswordCorrect) {
      throw new BadRequest("passwordIncorrect");
    }

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
  async register(@BodyParams() body: unknown, @Res() res: Response) {
    const data = validateSchema(AUTH_SCHEMA, body);

    const existing = await prisma.user.findUnique({
      where: {
        username: data.username,
      },
    });

    if (existing) {
      throw new BadRequest("userAlreadyExists");
    }

    const preCad = await prisma.cad.findFirst({ select: { registrationCode: true } });
    if (preCad?.registrationCode) {
      const code = data.registrationCode;
      if (code !== preCad.registrationCode) {
        throw new BadRequest("invalidRegistrationCode");
      }
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

    const extraUserData: Partial<User> =
      userCount <= 0
        ? {
            rank: Rank.OWNER,
            isDispatch: true,
            isLeo: true,
            isEmsFd: true,
            isSupervisor: true,
            isTow: true,
            whitelistStatus: WhitelistStatus.ACCEPTED,
          }
        : {
            isTow: !cad.towWhitelisted,
            rank: Rank.USER,
            whitelistStatus: cad.whitelisted ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
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
