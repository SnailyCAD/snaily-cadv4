import { Rank, type cad, WhitelistStatus, Feature, CadFeature, User, Prisma } from "@prisma/client";
import { PathParams, BodyParams, Context, QueryParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { BAN_SCHEMA, UPDATE_USER_SCHEMA, PERMISSIONS_SCHEMA } from "@snailycad/schemas";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { genSaltSync, hashSync } from "bcrypt";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { updateMemberRoles } from "lib/discord/admin";
import { isDiscordIdInUse } from "utils/discord";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { isFeatureEnabled } from "lib/cad";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/users")
export class ManageUsersController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewUsers,
      Permissions.ManageUsers,
      Permissions.BanUsers,
      Permissions.DeleteUsers,
    ],
  })
  @Description("Get all the users in the CAD.")
  async getUsers(
    @QueryParams("skip") skip = "0",
    @QueryParams("query") query = "",
    @QueryParams("pendingOnly") pendingOnly = "false",
  ) {
    const where =
      query || pendingOnly
        ? {
            ...(query ? { username: { contains: query, mode: Prisma.QueryMode.insensitive } } : {}),
            ...(pendingOnly === "true" ? { whitelistStatus: WhitelistStatus.PENDING } : {}),
          }
        : undefined;

    const [totalCount, pendingCount] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { whitelistStatus: WhitelistStatus.PENDING } }),
    ]);

    const users = await prisma.user.findMany({
      select: userProperties,
      where,
      take: 7,
      skip: Number(skip),
    });

    return { totalCount, pendingCount, users };
  }

  @Get("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewUsers,
      Permissions.ManageUsers,
      Permissions.BanUsers,
      Permissions.DeleteUsers,
    ],
  })
  async getUserById(
    @PathParams("id") userId: string,
    @QueryParams("select-citizens") selectCitizens: boolean,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userProperties,
        ...(selectCitizens ? { citizens: { include: citizenInclude } } : {}),
        apiToken: { include: { logs: { take: 35, orderBy: { createdAt: "desc" } } } },
      },
    });

    return user;
  }

  @Put("/permissions/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async updateUserPermissionsById(@PathParams("id") userId: string, @BodyParams() body: unknown) {
    const data = validateSchema(PERMISSIONS_SCHEMA, body);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER) {
      throw new ExtendedBadRequest({ rank: "cannotUpdateOwnerPermissions" });
    }

    const permissions = this.parsePermissions(data);

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: { permissions },
      select: userProperties,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
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
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
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
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.BanUsers],
  })
  async banUserById(
    @Context("user") authUser: User,
    @PathParams("id") userId: string,
    @PathParams("type") banType: "ban" | "unban",
    @BodyParams() body: unknown,
  ) {
    if (!["ban", "unban"].includes(banType)) {
      throw new NotFound("notFound");
    }

    const data = banType === "ban" ? validateSchema(BAN_SCHEMA, body) : null;

    const userToManage = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToManage) {
      throw new NotFound("notFound");
    }

    if (userToManage.rank === Rank.OWNER || authUser.id === userToManage.id) {
      throw new BadRequest("cannotBanSelfOrOwner");
    }

    const updated = await prisma.user.update({
      where: {
        id: userToManage.id,
      },
      data: {
        banReason: banType === "ban" ? data?.reason : null,
        banned: banType === "ban",
      },
      select: userProperties,
    });

    if (banType === "ban") {
      this.socket.emitUserBanned(userToManage.id);
    }

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteUsers],
  })
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
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers],
  })
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

  @Delete("/:userId/api-token")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers],
  })
  async revokeApiToken(
    @PathParams("userId") userId: string,
    @Context("cad") cad: cad & { features?: CadFeature[] },
  ) {
    const isUserAPITokensEnabled = isFeatureEnabled({
      feature: Feature.USER_API_TOKENS,
      features: cad.features,
      defaultReturn: false,
    });

    if (!isUserAPITokensEnabled) {
      throw new BadRequest("featureNotEnabled");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.apiTokenId) {
      throw new NotFound("notFound");
    }

    await prisma.apiToken.delete({
      where: { id: user.apiTokenId },
    });

    return true;
  }

  private parsePermissions(data: Record<string, string>) {
    const permissions: string[] = [];
    const values = Object.values(Permissions);

    values.forEach((name) => {
      const updatedPermission = data[name];
      if (!updatedPermission) return;

      permissions.push(updatedPermission);
    });

    return permissions;
  }
}
