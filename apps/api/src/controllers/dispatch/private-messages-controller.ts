import { Controller } from "@tsed/di";
import { ContentType, Get, Post } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { Socket } from "services/socket-service";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { DispatchChat } from "@prisma/client";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  combinedEmsFdUnitProperties,
} from "utils/leo/includes";
import { findUnit } from "lib/leo/findUnit";

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
  async getPrivateMessagesForUnit(@PathParams("unitId") unitId: string): Promise<DispatchChat[]> {
    const unitMessages = await prisma.dispatchChat.findMany({
      where: {
        OR: [
          { creator: { officerId: unitId } },
          { creator: { emsFdDeputyId: unitId } },
          { creator: { combinedEmsFdId: unitId } },
          { creator: { combinedLeoId: unitId } },
        ],
      },
      include: {
        creator: {
          include: {
            combinedUnit: { include: combinedUnitProperties },
            deputy: { include: unitProperties },
            combinedEmsFdUnit: { include: combinedEmsFdUnitProperties },
            officer: { include: leoProperties },
          },
        },
      },
    });

    return unitMessages.map((chat) => ({
      ...chat,
      creator: {
        unit:
          chat.creator?.officer ??
          chat.creator?.deputy ??
          chat.creator?.combinedUnit ??
          chat.creator?.combinedEmsFdUnit,
      },
    }));
  }

  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  @Post("/:unitId")
  async createPrivateMessage(
    @PathParams("unitId") unitId: string,
    @BodyParams("message") message: string,
  ): Promise<DispatchChat & { creator: any }> {
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

    const { type } = await findUnit(unitId);
    const types = {
      leo: "officerId",
      "ems-fd": "emsFdDeputyId",
      "combined-ems-fd": "combinedEmsFdId",
      "combined-leo": "combinedLeoId",
    } as const;

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
      // todo: variable for this
      include: {
        creator: {
          include: {
            combinedUnit: { include: combinedUnitProperties },
            deputy: { include: unitProperties },
            combinedEmsFdUnit: { include: combinedEmsFdUnitProperties },
            officer: { include: leoProperties },
          },
        },
      },
    });

    // todo: send socket event
    this.socket;

    return {
      ...chat,
      creator: {
        unit:
          chat.creator?.officer ??
          chat.creator?.deputy ??
          chat.creator?.combinedUnit ??
          chat.creator?.combinedEmsFdUnit,
      },
    };
  }
}
