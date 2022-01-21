import { Context, Res, BodyParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBefore } from "@tsed/platform-middlewares";
import { Delete, Patch, Post } from "@tsed/schema";
import { Cookie } from "@snailycad/config";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { setCookie } from "utils/setCookie";
import { User } from ".prisma/client";
import { NotFound } from "@tsed/exceptions";
import { CHANGE_PASSWORD_SCHEMA } from "@snailycad/schemas";
import { compareSync, genSaltSync, hashSync } from "bcrypt";
import { userProperties } from "lib/auth";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

@Controller("/user")
@UseBefore(IsAuth)
export class AccountController {
  @Post("/")
  async getAuthUser(@Context() ctx: Context) {
    return { ...ctx.get("user"), cad: ctx.get("cad") ?? null };
  }

  @Patch("/")
  async patchAuthUser(@BodyParams() body: any, @Context("user") user: User) {
    const { username, isDarkTheme, statusViewMode } = body;

    const existing = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existing && user.username !== username) {
      throw new ExtendedBadRequest({ username: "userAlreadyExists" });
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        username,
        isDarkTheme,
        statusViewMode,
      },
      select: userProperties,
    });

    return updated;
  }

  @Delete("/")
  async deleteAuthUser(@Context() ctx: Context) {
    await prisma.user.delete({
      where: {
        id: ctx.get("user").id,
      },
    });
  }

  @Post("/logout")
  async logoutUser(@Res() res: Res, @Context() ctx: Context) {
    const userId = ctx.get("user").id;

    ctx.delete("user");

    await prisma.officer.updateMany({
      where: { userId },
      data: { statusId: null },
    });

    await prisma.emsFdDeputy.updateMany({
      where: { userId },
      data: { statusId: null },
    });

    setCookie({
      res,
      name: Cookie.Session,
      expires: 0,
      value: "",
    });

    return true;
  }

  @Post("/password")
  async updatePassword(@Context("user") user: User, @BodyParams() body: unknown) {
    const data = validateSchema(CHANGE_PASSWORD_SCHEMA, body);

    const u = await prisma.user.findUnique({ where: { id: user.id } });

    if (!u) {
      throw new NotFound("notFound");
    }

    const { currentPassword, newPassword, confirmPassword } = data;
    if (confirmPassword !== newPassword) {
      throw new ExtendedBadRequest({ confirmPassword: "passwordsDoNotMatch" });
    }

    const userPassword = u.tempPassword ?? u.password;
    const isCurrentPasswordCorrect = compareSync(currentPassword, userPassword);
    if (!isCurrentPasswordCorrect) {
      throw new ExtendedBadRequest({ currentPassword: "currentPasswordIncorrect" });
    }

    const salt = genSaltSync();
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashSync(newPassword, salt),
        tempPassword: null,
      },
    });

    return true;
  }
}
