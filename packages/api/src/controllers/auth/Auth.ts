import * as yup from "yup";
import { Controller, BodyParams, Post, Res, Response } from "@tsed/common";
import { JsonRequestBody } from "@tsed/schema";
import { validateSchema } from "@casper124578/utils";
import { hashSync, genSaltSync, compareSync } from "bcrypt";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { setCookie } from "../../utils/setCookie";
import { signJWT } from "../../utils/jwt";
import { Cookie } from "../../config";

@Controller("/auth")
export class AuthController {
  @Post("/login")
  async login(@BodyParams() body: JsonRequestBody, @Res() res: Response) {
    const schema = {
      username: yup.string().required(),
      password: yup.string().required(),
    };

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

    return { user };
  }

  @Post("/register")
  async register(@BodyParams() body: JsonRequestBody, @Res() res: Response) {
    const schema = {
      username: yup.string().required(),
      password: yup.string().required(),
    };

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

    const salt = genSaltSync();
    const password = hashSync(body.get("password"), salt);
    const user = await prisma.user.create({
      data: {
        username: body.get("username"),
        password,
      },
    });

    const jwtToken = signJWT(user.id, 60 * 60);
    setCookie({
      res,
      name: Cookie.Session,
      expires: 60 * 60 * 1000,
      value: jwtToken,
    });

    return { user };
  }
}
