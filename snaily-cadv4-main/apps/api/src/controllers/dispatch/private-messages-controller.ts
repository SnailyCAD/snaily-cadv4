import { Context, Req } from "@tsed/common";
import { Controller } from "@tsed/di";
import { ContentType, Get, Post } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { Socket } from "services/socket-service";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { type DispatchChat, Prisma } from "@prisma/client";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  combinedEmsFdUnitProperties,
  callInclude,
} from "utils/leo/includes";
import { findUnit } from "lib/leo/findUnit";
import { hasPermission } from "@snailycad/permissions";
import { type User } from "@snailycad/types";
import { getActiveOfficer } from "lib/leo/activeOfficer";
import { getActiveDeputy } from "lib/get-active-ems-fd-deputy";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { validateSchema } from "lib/data/validate-schema";
import { PRIVATE_MESSAGE_SCHEMA } from "@snailycad/schemas";
import { incidentInclude } from "controllers/leo/incidents/IncidentController";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";

const dispatchChatIncludes = Prisma.validator<Prisma.DispatchChatSelect>()({
  call: { include: callInclude },
  incident: { include: incidentInclude },
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

      const { unit } = await findUnit(unitId);
      const activeUnit = activeOfficer ?? activeDeputy;

      if (unit?.id !== activeUnit?.id) {
        throw new ExtendedBadRequest({ message: "onlyDispatchCanStartPrivateMessage" });
      }
    }

    const unitMessages = await prisma.dispatchChat.findMany({
      where: { unitId },
      orderBy: { createdAt: "asc" },
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
    @Context("user") user: User,
    @Context() ctx: Context,
    @Req() request: Req,
    @BodyParams() body: unknown,
  ): Promise<DispatchChat & { creator: any }> {
    const data = validateSchema(PRIVATE_MESSAGE_SCHEMA, body);

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
        throw new ExtendedBadRequest({ message: "onlyDispatchCanStartPrivateMessage" });
      }
    }

    const chatMessage = await prisma.dispatchChat.findFirst({
      where: {
        unitId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // only Dispatch is allowed to create the initial chat and send the first chat message
    if (!chatMessage && !isDispatch) {
      throw new ExtendedBadRequest({ message: "onlyDispatchCanCreateInitialChat" });
    }

    let call911Id;
    let incidentId;

    if (data.call911Id) {
      const call = await prisma.call911.findUnique({
        where: { id: data.call911Id },
      });

      if (!call) {
        throw new ExtendedBadRequest({ message: "callDoesNotExist" });
      }

      call911Id = { connect: { id: call.id } };
    }

    if (data.incidentId) {
      const incident = await prisma.leoIncident.findFirst({
        where: { id: data.incidentId, isActive: true },
      });

      if (!incident) {
        throw new ExtendedBadRequest({ message: "incidentDoesNotExist" });
      }

      incidentId = { connect: { id: incident.id } };
    }

    const chat = await prisma.dispatchChat.create({
      data: {
        message: data.message,
        call: call911Id,
        incident: incidentId,
        unitId,
        creator: {
          connectOrCreate: isDispatch
            ? undefined
            : {
                where: { id: String(chatMessage?.creatorId) },
                create: {
                  [types[type]]: unitId,
                },
              },
        },
      },
      include: dispatchChatIncludes,
    });

    const normalizedChat = {
      ...chat,
      creator: { unit: createChatCreatorUnit(chat) },
      call: officerOrDeputyToUnit(chat.call),
      incident: officerOrDeputyToUnit(chat.incident),
    };

    this.socket.emitPrivateMessage(unitId, normalizedChat);

    return normalizedChat;
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
