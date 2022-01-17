import { Rank, WhitelistStatus } from ".prisma/client";
import { PathParams, BodyParams, Context, QueryParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { BAN_SCHEMA, UPDATE_USER_SCHEMA, validate } from "@snailycad/schemas";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { genSaltSync, hashSync } from "bcrypt";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateSchema } from "lib/validateSchema";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/users")
export class ManageUsersController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
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
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userProperties });

    const citizens =
      selectCitizens && user
        ? await prisma.citizen.findMany({
            where: { userId },
            include: citizenInclude,
          })
        : undefined;

    if (user && selectCitizens) {
      // @ts-expect-error ignore
      user.citizens = citizens;
    }

    return user;
  }

  @Put("/:id")
  async updateUserById(@PathParams("id") userId: string, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_USER_SCHEMA, body);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER && data.rank !== Rank.OWNER) {
      throw new BadRequest("cannotUpdateOwnerRank");
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
        steamId: data.steamId,
        rank: user.rank === Rank.OWNER ? Rank.OWNER : Rank[data.rank as Rank],
      },
      select: userProperties,
    });

    return updated;
  }

  @Post("/temp-password/:id")
  async giveUserTempPassword(@PathParams("id") userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        NOT: {
          rank: "OWNER",
        },
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

    return password;
  }

  @Post("/:id/:type")
  async banUserById(
    @Context() ctx: Context,
    @PathParams("id") userId: string,
    @PathParams("type") banType: "ban" | "unban",
    @BodyParams() body: JsonRequestBody,
  ) {
    if (!["ban", "unban"].includes(banType)) {
      throw new NotFound("notFound");
    }

    if (banType === "ban") {
      const error = validate(BAN_SCHEMA, body.toJSON(), true);
      if (error) {
        throw new BadRequest(error);
      }
    }

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
        banReason: banType === "ban" ? body.get("reason") : null,
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
        NOT: {
          rank: "OWNER",
        },
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
  ) {
    if (!["accept", "decline"].includes(type)) {
      throw new BadRequest("invalidType");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        whitelistStatus: "PENDING",
        NOT: {
          rank: "OWNER",
        },
      },
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        whitelistStatus: type === "accept" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED,
      },
    });

    return true;
  }
}
