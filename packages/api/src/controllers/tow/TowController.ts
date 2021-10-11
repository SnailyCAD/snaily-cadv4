import { Controller, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { validate, TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "../../middlewares";
import { CadSocketService } from "../../services/SocketService";

@Controller("/tow")
export class TowController {
  private socket: CadSocketService;
  constructor(socket: CadSocketService) {
    this.socket = socket;
  }

  @Get("/")
  async getTowCalls() {
    const calls = await prisma.towCall.findMany({
      include: {
        assignedUnit: true,
        creator: true,
      },
    });

    return calls;
  }

  @UseBefore(IsAuth)
  @Post("/")
  async createTowCall(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(TOW_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("creatorId"),
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const call = await prisma.towCall.create({
      data: {
        creatorId: body.get("creatorId"),
        userId: ctx.get("user").id,
        description: body.get("description"),
        location: body.get("location"),
      },
      include: {
        creator: true,
        assignedUnit: true,
      },
    });

    await this.socket.emitTowCall(call);

    return call;
  }

  @UseBefore(IsAuth)
  @Put("/:id")
  async updateCall(@PathParams("id") callId: string, @BodyParams() body: JsonRequestBody) {
    const error = validate(UPDATE_TOW_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const call = await prisma.towCall.findUnique({
      where: {
        id: callId,
      },
    });

    if (!call) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.towCall.update({
      where: {
        id: callId,
      },
      data: {
        description: body.get("description"),
        location: body.get("location"),
        assignedUnit: body.get("assignedUnitId")
          ? { connect: { id: body.get("assignedUnitId") } }
          : undefined,
      },
      include: {
        creator: true,
        assignedUnit: true,
      },
    });

    await this.socket.emitUpdateTowCall(updated);

    return updated;
  }
}
