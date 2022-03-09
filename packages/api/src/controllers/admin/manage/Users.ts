import { Rank, type cad, WhitelistStatus } from "@prisma/client";
import { PathParams, BodyParams, Context, QueryParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { BAN_SCHEMA, UPDATE_USER_SCHEMA } from "@snailycad/schemas";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { genSaltSync, hashSync } from "bcrypt";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { updateMemberRoles } from "lib/discord/admin";
import { isDiscordIdInUse } from "utils/discord";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/users")
export class ManageUsersController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the users in the CAD")
  async getUsers() {
    const users = await prisma.user.findMany({
      select: userProperties,
    });

    return users;
  }

  @Get("/:id")
  async getUserById(
    @PathParams("id") userId: string,
    @QueryParams("select-citizens") selectCitizens: boolean,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userProperties,
        ...(selectCitizens ? { citizens: { include: citizenInclude } } : {}),
      },
    });

    return user;
  }

  @Put("/:id")
  async updateUserById(
    @Context("cad") cad: { discordRolesId: string | null },
    @PathParams("id") userId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(UPDATE_USER_SCHEMA, body);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER && data.rank !== Rank.OWNER) {
      throw new ExtendedBadRequest({ rank: "cannotUpdateOwnerRank" });
    }

    if (data.discordId && (await isDiscordIdInUse(data.discordId, user.id))) {
      throw new ExtendedBadRequest({ discordId: "discordIdInUse" });
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isLeo: data.isLeo,
        isSupervisor: data.isSupervisor,
        isDispatch: data.isDispatch,
        isEmsFd: data.isEmsFd,
        isTow: data.isTow,
        isTaxi: data.isTaxi,
        steamId: data.steamId,
        rank: user.rank === Rank.OWNER ? Rank.OWNER : Rank[data.rank as Rank],
        discordId: data.discordId,
      },
      select: userProperties,
    });

    if (updated.discordId) {
      await updateMemberRoles(updated, cad.discordRolesId);
    }

    return updated;
  }

  @Post("/temp-password/:id")
  async giveUserTempPassword(@PathParams("id") userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        NOT: { rank: Rank.OWNER },
      },
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    const password = nanoid();
    const salt = genSaltSync();
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        tempPassword: hashSync(password, salt),
      },
    });

    const user2FA = await prisma.user2FA.findFirst({
      where: { userId },
    });

    if (user2FA) {
      await prisma.user2FA.delete({
        where: { id: user2FA.id },
      });
    }

    return password;
  }

  @Post("/:id/:type")
  async banUserById(
    @Context() ctx: Context,
    @PathParams("id") userId: string,
    @PathParams("type") banType: "ban" | "unban",
    @BodyParams() body: unknown,
  ) {
    if (!["ban", "unban"].includes(banType)) {
      throw new NotFound("notFound");
    }

    const data = banType === "ban" ? validateSchema(BAN_SCHEMA, body) : null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER || ctx.get("user").id === user.id) {
      throw new BadRequest("cannotBanSelfOrOwner");
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        banReason: banType === "ban" ? data?.reason : null,
        banned: banType === "ban",
      },
      select: userProperties,
    });

    if (banType === "ban") {
      this.socket.emitUserBanned(user.id);
    }

    return updated;
  }

  @Delete("/:id")
  async deleteUserAccount(@PathParams("id") userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        NOT: { rank: Rank.OWNER },
      },
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    this.socket.emitUserDeleted(user.id);

    return true;
  }

  @Post("/pending/:id/:type")
  async acceptOrDeclineUser(
    @PathParams("id") userId: string,
    @PathParams("type") type: "accept" | "decline",
    @Context("cad") cad: cad & { discordRolesId: string | null },
  ) {
    if (!["accept", "decline"].includes(type)) {
      throw new BadRequest("invalidType");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        whitelistStatus: WhitelistStatus.PENDING,
        NOT: { rank: Rank.OWNER },
      },
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    const whitelistStatus = type === "accept" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED;
    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: { whitelistStatus },
    });

    if (updated.discordId && cad.whitelisted) {
      await updateMemberRoles(updated, cad.discordRolesId);
    }

    return true;
  }
}
