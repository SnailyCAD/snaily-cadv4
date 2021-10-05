import * as yup from "yup";
import { User, WhitelistStatus, Rank } from ".prisma/client";
import { JsonRequestBody } from "@tsed/schema";
import { Controller, BodyParams, Post, Res, Response } from "@tsed/common";
import { validateSchema } from "@casper124578/utils";
import { hashSync, genSaltSync, compareSync } from "bcrypt";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { setCookie } from "../../utils/setCookie";
import { signJWT } from "../../utils/jwt";
import { Cookie } from "../../config";
import { findOrCreateCAD } from "../../lib/cad";

const schema = {
  username: yup.string().required(),
  password: yup.string().required().min(8),
};

@Controller("/auth")
export class AuthController {
  @Post("/login")
  async login(@BodyParams() body: JsonRequestBody, @Res() res: Response) {
    const [error] = await validateSchema(schema, body.toJSON());
    if (error) {
      throw new BadRequest(error.message);
    }

    const user = await prisma.user.findUnique({
      where: {
        username: body.username,
      },
    });

    if (!user) {
      throw new NotFound("User was not found");
    }

    if (user.whitelistStatus === WhitelistStatus.PENDING) {
      return {
        error: "whitelist_pending",
      };
    }

    if (user.whitelistStatus === WhitelistStatus.DECLINED) {
      return {
        error: "whitelist_declined",
      };
    }

    const isPasswordCorrect = compareSync(body.get("password"), user.password);

    if (!isPasswordCorrect) {
      throw new BadRequest("Password is incorrect");
    }

    const jwtToken = signJWT({ userId: user.id }, 60 * 60);
    setCookie({
      res,
      name: Cookie.Session,
      expires: 60 * 60 * 1000,
      value: jwtToken,
    });

    return res.json({ userId: user.id });
  }

  @Post("/register")
  async register(@BodyParams() body: JsonRequestBody, @Res() res: Response) {
    const [error] = await validateSchema(schema, body.toJSON());
    if (error) {
      throw new BadRequest(error.message);
    }

    const existing = await prisma.user.findUnique({
      where: {
        username: body.username,
      },
    });

    if (existing) {
      throw new BadRequest("User already exists with that username");
    }

    const userCount = await prisma.user.count();
    const salt = genSaltSync();

    const password = hashSync(body.get("password"), salt);

    const user = await prisma.user.create({
      data: {
        username: body.get("username"),
        password,
      },
    });

    const cad = await findOrCreateCAD({
      ownerId: user.id,
    });

    console.log(JSON.stringify(cad, null, 2));

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
      return {
        error: "cad_whitelisted_pending",
      };
    }

    const jwtToken = signJWT({ userId: user.id }, 60 * 60);
    setCookie({
      res,
      name: Cookie.Session,
      expires: 60 * 60 * 1000,
      value: jwtToken,
    });

    return { userId: user.id };
  }
}
