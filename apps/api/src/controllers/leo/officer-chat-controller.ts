import { Context, Req } from "@tsed/common";
import { Controller } from "@tsed/di";
import { ContentType, Get, Post } from "@tsed/schema";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { Socket } from "services/socket-service";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { leoProperties, combinedUnitProperties } from "utils/leo/includes";
import { type User } from "@snailycad/types";
import { getActiveOfficer } from "lib/leo/activeOfficer";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { validateSchema } from "lib/data/validate-schema";
import { OFFICER_CHAT_SCHEMA } from "@snailycad/schemas";

const officerChatIncludes = {
  creator: {
    include: {
      combinedUnit: { include: combinedUnitProperties },
      officer: { include: leoProperties },
    },
  },
} as const;

@Controller("/leo/officer-chat")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class OfficerChatController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async getOfficerChatMessages(
    @Context("user") user: User,
    @Context() ctx: Context,
    @Req() request: Req,
  ): Promise<
    { id: string; createdAt: Date; updatedAt: Date; message: string; creator: { unit: any } }[]
  > {
    // Verify user has an active officer (on duty)
    const activeOfficer = await getActiveOfficer({ ctx, user, req: request });

    if (!activeOfficer) {
      throw new ExtendedBadRequest({ message: "mustBeOnDuty" });
    }

    const messages = await (prisma as any).officerChat.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: officerChatIncludes,
    });

    return messages.reverse().map((chat: any) => ({
      ...chat,
      creator: { unit: createChatCreatorUnit(chat) },
    }));
  }

  @Post("/")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async createOfficerChatMessage(
    @Context("user") user: User,
    @Context() ctx: Context,
    @Req() request: Req,
    @BodyParams() body: unknown,
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    message: string;
    creator: { unit: any };
  }> {
    const data = validateSchema(OFFICER_CHAT_SCHEMA, body);

    const activeOfficer = await getActiveOfficer({ ctx, user, req: request });

    if (!activeOfficer) {
      throw new ExtendedBadRequest({ message: "mustBeOnDuty" });
    }

    const isCombinedUnit = "officers" in activeOfficer && Array.isArray(activeOfficer.officers);
    const unitId = isCombinedUnit ? activeOfficer.id : activeOfficer.id;
    const unitType = isCombinedUnit ? "combined-leo" : "leo";

    const types = {
      leo: "officerId",
      "combined-leo": "combinedLeoId",
    } as const;

    const existingCreator = await prisma.chatCreator.findFirst({
      where: {
        [types[unitType]]: unitId,
      },
    });

    const creatorData = existingCreator
      ? { connect: { id: existingCreator.id } }
      : {
          create: {
            [types[unitType]]: unitId,
          },
        };

    const chat = await (prisma as any).officerChat.create({
      data: {
        message: data.message,
        creator: creatorData,
      },
      include: officerChatIncludes,
    });

    const normalizedChat = {
      ...chat,
      creator: { unit: createChatCreatorUnit(chat) },
    };

    this.socket.emitOfficerChat(normalizedChat);

    return normalizedChat;
  }
}

function createChatCreatorUnit(chat: { creator?: any }): any {
  return chat.creator?.officer ?? chat.creator?.combinedUnit ?? null;
}
