import { Context, Req } from "@tsed/common";
import { Controller } from "@tsed/di";
import { ContentType, Get, Post } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { Socket } from "services/socket-service";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { DispatchChat, Prisma } from "@prisma/client";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  combinedEmsFdUnitProperties,
} from "utils/leo/includes";
import { findUnit } from "lib/leo/findUnit";
import { hasPermission } from "@snailycad/permissions";
import { User } from "@snailycad/types";
import { getActiveOfficer } from "lib/leo/activeOfficer";
import { getActiveDeputy } from "lib/get-active-ems-fd-deputy";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";

const dispatchChatIncludes = Prisma.validator<Prisma.DispatchChatSelect>()({
  creator: {
    include: {
      combinedUnit: { include: combinedUnitProperties },
      deputy: { include: unitProperties },
      combinedEmsFdUnit: { include: combinedEmsFdUnitProperties },
      officer: { include: leoProperties },
    },
  },
});

@Controller("/dispatch/private-message")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class DispatchPrivateMessagesController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/:unitId")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async getPrivateMessagesForUnit(
    @PathParams("unitId") unitId: string,
    @Context("user") user: User,
    @Context() ctx: Context,
    @Req() request: Req,
  ): Promise<DispatchChat[]> {
    const isFromDispatch = request.headers["is-from-dispatch"] === "true";
    const isDispatch =
      isFromDispatch &&
      hasPermission({
        userToCheck: user,
        permissionsToCheck: [Permissions.Dispatch],
      });

    if (!isDispatch) {
      const [activeOfficer, activeDeputy] = await Promise.all([
        getActiveOfficer({ ctx, user, req: request }).catch(() => null),
        getActiveDeputy({ ctx, user, req: request }).catch(() => null),
      ]);

      const activeUnit = activeOfficer ?? activeDeputy;
      const { unit } = await findUnit(unitId);

      if (unit?.id !== activeUnit?.id) {
        throw new ExtendedBadRequest({ message: "Insufficient permissions" });
      }
    }

    const unitMessages = await prisma.dispatchChat.findMany({
      where: {
        OR: [
          { creator: { officerId: unitId } },
          { creator: { emsFdDeputyId: unitId } },
          { creator: { combinedEmsFdId: unitId } },
          { creator: { combinedLeoId: unitId } },
        ],
      },
      include: dispatchChatIncludes,
    });

    return unitMessages.map((chat) => ({
      ...chat,
      creator: { unit: createChatCreatorUnit(chat) },
    }));
  }

  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  @Post("/:unitId")
  async createPrivateMessage(
    @PathParams("unitId") unitId: string,
    @BodyParams("message") message: string,
    @Context("user") user: User,
    @Context() ctx: Context,
    @Req() request: Req,
  ): Promise<DispatchChat & { creator: any }> {
    const isFromDispatch = request.headers["is-from-dispatch"] === "true";
    const isDispatch =
      isFromDispatch &&
      hasPermission({
        userToCheck: user,
        permissionsToCheck: [Permissions.Dispatch],
      });

    const { type, unit } = await findUnit(unitId);
    const types = {
      leo: "officerId",
      "ems-fd": "emsFdDeputyId",
      "combined-ems-fd": "combinedEmsFdId",
      "combined-leo": "combinedLeoId",
    } as const;

    if (!isDispatch) {
      const [activeOfficer, activeDeputy] = await Promise.all([
        getActiveOfficer({ ctx, user, req: request }).catch(() => null),
        getActiveDeputy({ ctx, user, req: request }).catch(() => null),
      ]);

      const activeUnit = activeOfficer ?? activeDeputy;

      if (unit?.id !== activeUnit?.id) {
        throw new ExtendedBadRequest({ message: "Insufficient permissions" });
      }
    }

    const creator = await prisma.chatCreator.findFirst({
      where: {
        OR: [
          { officerId: unitId },
          { emsFdDeputyId: unitId },
          { combinedEmsFdId: unitId },
          { combinedLeoId: unitId },
        ],
      },
    });

    // only Dispatch is allowed to create the initial chat and send the first chat message
    if (!creator && !isDispatch) {
      throw new ExtendedBadRequest({ message: "onlyDispatchCanCreateInitialChat" });
    }

    const chat = await prisma.dispatchChat.create({
      data: {
        message,
        creator: {
          connectOrCreate: {
            where: { id: String(creator?.id) },
            create: {
              [types[type]]: unitId,
            },
          },
        },
      },
      include: dispatchChatIncludes,
    });

    // todo: send socket event
    this.socket;

    return {
      ...chat,
      creator: { unit: createChatCreatorUnit(chat) },
    };
  }
}

function createChatCreatorUnit(chat: { creator?: any }) {
  return (
    chat.creator?.officer ??
    chat.creator?.deputy ??
    chat.creator?.combinedUnit ??
    chat.creator?.combinedEmsFdUnit ??
    null
  );
}
