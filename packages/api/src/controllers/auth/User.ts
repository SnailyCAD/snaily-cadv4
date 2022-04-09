import { Context, Res, BodyParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBefore } from "@tsed/platform-middlewares";
import { Delete, Description, Patch, Post } from "@tsed/schema";
import { Cookie } from "@snailycad/config";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { setCookie } from "utils/setCookie";
import { ShouldDoType, User } from "@prisma/client";
import { NotFound } from "@tsed/exceptions";
import { CHANGE_PASSWORD_SCHEMA } from "@snailycad/schemas";
import { compareSync, genSaltSync, hashSync } from "bcrypt";
import { userProperties } from "lib/auth/user";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { Socket } from "services/SocketService";
import { handleStartEndOfficerLog } from "lib/leo/handleStartEndOfficerLog";

@Controller("/user")
@UseBefore(IsAuth)
export class AccountController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/")
  @Description("Get the authenticated user's information")
  async getAuthUser(@Context() ctx: Context) {
    return { ...ctx.get("user"), cad: ctx.get("cad") ?? null };
  }

  @Patch("/")
  @Description("Update the authenticated user's settings")
  async patchAuthUser(@BodyParams() body: any, @Context("user") user: User) {
    const { soundSettings, username, isDarkTheme, statusViewMode, tableActionsAlignment } = body;

    const existing = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existing && user.username !== username) {
      throw new ExtendedBadRequest({ username: "userAlreadyExists" });
    }

    let soundSettingsId = null;
    if (soundSettings) {
      const updateCreateData = {
        panicButton: soundSettings.panicButton,
        signal100: soundSettings.signal100,
        addedToCall: soundSettings.addedToCall,
        stopRoleplay: soundSettings.stopRoleplay,
      };

      const updated = await prisma.userSoundSettings.upsert({
        where: { id: String(user.soundSettingsId) },
        create: updateCreateData,
        update: updateCreateData,
      });

      soundSettingsId = updated.id;
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        username,
        isDarkTheme,
        statusViewMode,
        tableActionsAlignment,
        soundSettingsId,
      },
      select: userProperties,
    });

    return updated;
  }

  @Delete("/")
  @Description("Delete the authenticated user's account")
  async deleteAuthUser(@Context("user") user: User) {
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });
  }

  @Post("/logout")
  @Description("Logout the authenticated user")
  async logoutUser(@Res() res: Res, @Context() ctx: Context) {
    const userId = ctx.get("user").id;

    ctx.delete("user");

    const officer = await prisma.officer.findFirst({
      where: {
        userId,
        status: {
          NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY },
        },
      },
    });

    if (officer) {
      await prisma.officer.update({
        where: { id: officer.id },
        data: { statusId: null },
      });

      await handleStartEndOfficerLog({
        officer,
        shouldDo: "SET_OFF_DUTY",
        socket: this.socket,
        userId,
      });

      this.socket.emitUpdateOfficerStatus();
    }

    await prisma.emsFdDeputy.updateMany({
      where: { userId },
      data: { statusId: null },
    });

    this.socket.emitUpdateDeputyStatus();

    setCookie({
      res,
      name: Cookie.Session,
      expires: 0,
      value: "",
    });

    return true;
  }

  @Post("/password")
  @Description("Update the authenticated user's password")
  async updatePassword(@Context("user") user: User, @BodyParams() body: unknown) {
    const data = validateSchema(CHANGE_PASSWORD_SCHEMA, body);

    const u = await prisma.user.findUnique({ where: { id: user.id } });

    if (!u) {
      throw new NotFound("notFound");
    }

    const { currentPassword, newPassword, confirmPassword } = data;
    const usesDiscordOAuth = u.discordId && !u.password.trim();

    if (confirmPassword !== newPassword) {
      throw new ExtendedBadRequest({ confirmPassword: "passwordsDoNotMatch" });
    }

    /**
     * if the user is authenticated via Discord Oauth,
     * their model is created with an empty password. Therefore the user cannot login
     * if the user wants to enable password login, they can do so by providing a new-password
     * without entering the `currentPassword`.
     */
    if (!usesDiscordOAuth && currentPassword) {
      const userPassword = u.tempPassword ?? u.password;
      const isCurrentPasswordCorrect = compareSync(currentPassword, userPassword);
      if (!isCurrentPasswordCorrect) {
        throw new ExtendedBadRequest({ currentPassword: "currentPasswordIncorrect" });
      }
    } else {
      if (!usesDiscordOAuth && !currentPassword) {
        throw new ExtendedBadRequest({ currentPassword: "Should be at least 8 characters" });
      }
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
