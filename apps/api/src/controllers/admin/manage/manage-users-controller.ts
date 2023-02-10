import { Rank, type cad, WhitelistStatus, Feature, User, Prisma, CustomRole } from "@prisma/client";
import { PathParams, BodyParams, Context, QueryParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import {
  BAN_SCHEMA,
  UPDATE_USER_SCHEMA,
  PERMISSIONS_SCHEMA,
  ROLES_SCHEMA,
} from "@snailycad/schemas";
import { Socket } from "services/socket-service";
import { nanoid } from "nanoid";
import { genSaltSync, hashSync } from "bcrypt";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateSchema } from "lib/data/validate-schema";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { isFeatureEnabled } from "lib/cad";
import { manyToManyHelper } from "lib/data/many-to-many";
import type * as APITypes from "@snailycad/types/api";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { isDiscordIdInUse } from "lib/discord/utils";

const manageUsersSelect = (selectCitizens: boolean) =>
  ({
    ...userProperties,
    ...(selectCitizens ? { citizens: { include: citizenInclude } } : {}),
    apiToken: { include: { logs: { take: 35, orderBy: { createdAt: "desc" } } } },
    roles: true,
    User2FA: true,
  } as const);

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/users")
@ContentType("application/json")
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
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
    @QueryParams("pendingOnly", Boolean) pendingOnly = false,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetManageUsersData> {
    const where =
      query || pendingOnly
        ? {
            ...(query
              ? {
                  OR: [
                    { username: { contains: query, mode: Prisma.QueryMode.insensitive } },
                    { id: query },
                  ],
                }
              : {}),
            ...(pendingOnly ? { whitelistStatus: WhitelistStatus.PENDING } : {}),
          }
        : undefined;

    const [totalCount, pendingCount] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.count({ where: { whitelistStatus: WhitelistStatus.PENDING } }),
    ]);

    const shouldIncludeAll = includeAll;
    const users = await prisma.user.findMany({
      select: userProperties,
      where,
      take: shouldIncludeAll ? undefined : 35,
      skip: shouldIncludeAll ? undefined : Number(skip),
    });

    return { totalCount, pendingCount, users };
  }

  @Get("/prune")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async getInactiveUsers(@QueryParams("days", Number) days = 30) {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: {
          NOT: { rank: Rank.OWNER },
          lastSeen: {
            lte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * days),
          },
        },
        select: userProperties,
      }),
      prisma.user.count({
        where: {
          NOT: { rank: Rank.OWNER },
          lastSeen: {
            lte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * days),
          },
        },
      }),
    ]);

    return { users, total };
  }

  @Delete("/prune")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async pruneInactiveUsers(
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams("userIds", String) userIds: string[],
    @BodyParams("days", Number) days = 30,
  ) {
    const arr = await prisma.$transaction(
      userIds.map((id) =>
        prisma.user.deleteMany({
          where: {
            id,
            NOT: { rank: Rank.OWNER },
            updatedAt: { lte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * days) },
          },
        }),
      ),
    );

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UsersPruned },
      prisma,
      executorId: sessionUserId,
    });

    return { count: arr.length };
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
    @PathParams("id") id: string,
    @QueryParams("select-citizens") selectCitizens: boolean,
  ): Promise<APITypes.GetManageUserByIdData> {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { discordId: id }, { steamId: id }] },
      select: manageUsersSelect(selectCitizens),
    });

    if (!user) {
      throw new NotFound("userNotFound");
    }

    const { User2FA, ...rest } = user;
    const _user = {
      twoFactorEnabled: User2FA.length >= 1,
      ...rest,
    };

    return _user;
  }

  @Post("/search")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async searchUsers(
    @BodyParams("username") username: string,
  ): Promise<APITypes.PostManageUsersSearchData> {
    const users = await prisma.user.findMany({
      where: { username: { contains: username, mode: "insensitive" } },
      select: userProperties,
      take: 35,
    });

    return users;
  }

  @Put("/permissions/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async updateUserPermissionsById(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") userId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutManageUserPermissionsByIdData> {
    const data = validateSchema(PERMISSIONS_SCHEMA, body);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: manageUsersSelect(false),
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER) {
      throw new ExtendedBadRequest({ rank: "cannotUpdateOwnerPermissions" });
    }

    const permissions = this.parsePermissions(data, user);

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: { permissions },
      select: manageUsersSelect(false),
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UserPermissionsUpdate, new: updated, previous: user },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Put("/roles/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async updateUserRolesById(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") userId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutManageUserByIdRolesData> {
    const data = validateSchema(ROLES_SCHEMA, body);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: manageUsersSelect(false),
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER) {
      throw new ExtendedBadRequest({ rank: "cannotUpdateOwnerPermissions" });
    }

    const disconnectConnectArr = manyToManyHelper(
      user.roles.map((v) => v.id),
      data.roles as string[],
    );

    await prisma.$transaction(
      disconnectConnectArr.map((disconnectConnectData) =>
        prisma.user.update({ where: { id: user.id }, data: { roles: disconnectConnectData } }),
      ),
    );

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: manageUsersSelect(false),
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UserRolesUpdate, new: updated, previous: user },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async updateUserById(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") userId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutManageUserByIdData> {
    const data = validateSchema(UPDATE_USER_SCHEMA, body);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: manageUsersSelect(false),
    });

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
        username: data.username,
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
      select: manageUsersSelect(false),
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UserUpdate, new: updated, previous: user },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Post("/temp-password/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
  })
  async giveUserTempPassword(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") userId: string,
  ): Promise<APITypes.PostManageUsersGiveTempPasswordData> {
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

    await createAuditLogEntry({
      translationKey: "tempPasswordGiven",
      action: { type: AuditLogActionType.UserTempPassword, new: user },
      prisma,
      executorId: sessionUserId,
    });

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
  ): Promise<APITypes.PostManageUserBanUnbanData> {
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

      await createAuditLogEntry({
        translationKey: "userBanned",
        action: { type: AuditLogActionType.UserBan, new: updated },
        prisma,
        executorId: authUser.id,
      });
    } else {
      await createAuditLogEntry({
        translationKey: "userUnbanned",
        action: { type: AuditLogActionType.UserUnban, new: updated },
        prisma,
        executorId: authUser.id,
      });
    }

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteUsers],
  })
  async deleteUserAccount(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") userId: string,
  ): Promise<APITypes.DeleteManageUsersData> {
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

    await createAuditLogEntry({
      translationKey: "deletedEntry",
      action: { type: AuditLogActionType.UserDelete, new: user },
      prisma,
      executorId: sessionUserId,
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
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") userId: string,
    @PathParams("type") type: "accept" | "decline",
  ): Promise<APITypes.PostManageUserAcceptDeclineData> {
    if (!["accept", "decline"].includes(type)) {
      throw new BadRequest("invalidType");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        whitelistStatus: WhitelistStatus.PENDING,
        NOT: { rank: Rank.OWNER },
      },
      select: { id: true, username: true, whitelistStatus: true },
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    const whitelistStatus = type === "accept" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { whitelistStatus },
      select: { id: true, username: true, whitelistStatus: true },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.UserWhitelistStatusChange,
        previous: user,
        new: updatedUser,
      },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  @Delete("/:userId/api-token")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers],
  })
  async revokeApiToken(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("userId") userId: string,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
  ): Promise<APITypes.DeleteManageUserRevokeApiTokenData> {
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

    if (!user?.apiTokenId) {
      throw new NotFound("notFound");
    }

    await prisma.apiToken.delete({
      where: { id: user.apiTokenId },
    });

    await createAuditLogEntry({
      translationKey: "deleteUserApiToken",
      action: { type: AuditLogActionType.UserApiTokenDelete, new: user },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  @Delete("/:userId/2fa")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageUsers],
  })
  async disableUser2FA(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("userId") userId: string,
  ): Promise<APITypes.DeleteManageUserRevokeApiTokenData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFound("notFound");
    }

    await prisma.user2FA.deleteMany({
      where: { userId: user.id },
    });

    await createAuditLogEntry({
      translationKey: "deleteUser2FA",
      action: { type: AuditLogActionType.User2FADelete, new: user },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  private parsePermissions(data: Record<string, string>, user: { roles: CustomRole[] }) {
    const permissions: string[] = [];
    const values = Object.values(Permissions);
    const rolePermissions = user.roles.flatMap((r) => r.permissions);

    for (const name of values) {
      const updatedPermission = data[name];

      if (!updatedPermission || rolePermissions.includes(updatedPermission)) {
        continue;
      }

      permissions.push(updatedPermission);
    }

    return permissions;
  }
}
