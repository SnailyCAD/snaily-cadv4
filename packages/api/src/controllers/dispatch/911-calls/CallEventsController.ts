import { Controller } from "@tsed/di";
import { Delete, Post, Put } from "@tsed/schema";
import { CREATE_911_CALL_EVENT } from "@snailycad/schemas";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/index";
import { validateSchema } from "lib/validateSchema";

@Controller("/911-calls/events")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/:callId")
  async createCallEvent(@PathParams("callId") callId: string, @BodyParams() body: unknown) {
    const data = validateSchema(CREATE_911_CALL_EVENT, body);

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const event = await prisma.call911Event.create({
      data: {
        call911Id: call.id,
        description: data.description,
      },
    });

    this.socket.emitAddCallEvent(event);

    return event;
  }

  @Put("/:callId/:eventId")
  async updateCallEvent(
    @PathParams("callId") callId: string,
    @PathParams("eventId") eventId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_911_CALL_EVENT, body);

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const event = await prisma.call911Event.findFirst({
      where: {
        id: eventId,
        call911Id: callId,
      },
    });

    if (!event) {
      throw new NotFound("eventNotFound");
    }

    const updated = await prisma.call911Event.update({
      where: {
        id: event.id,
      },
      data: {
        description: data.description,
      },
    });

    this.socket.emitUpdateCallEvent(updated);

    return updated;
  }

  @Delete("/:callId/:eventId")
  async deleteCallEvent(
    @PathParams("callId") callId: string,
    @PathParams("eventId") eventId: string,
  ) {
    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const event = await prisma.call911Event.findFirst({
      where: {
        id: eventId,
        call911Id: callId,
      },
    });

    if (!event) {
      throw new NotFound("eventNotFound");
    }

    await prisma.call911Event.delete({
      where: {
        id: event.id,
      },
    });

    this.socket.emitDeleteCallEvent(event);

    return true;
  }
}
