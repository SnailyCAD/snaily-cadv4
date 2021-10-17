import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_BOLO_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Use, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "../../middlewares";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";
import { Socket } from "../../services/SocketService";

@Controller("/bolos")
@UseBeforeEach(IsAuth)
export class BoloController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getBolos() {
    const bolos = await prisma.bolo.findMany({
      include: {
        officer: true,
      },
    });

    return bolos;
  }

  @Use(ActiveOfficer)
  @Post("/")
  async createBolo(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_BOLO_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const bolo = await prisma.bolo.create({
      data: {
        description: body.get("description"),
        type: body.get("type"),
        color: body.get("color") ?? null,
        name: body.get("name") ?? null,
        plate: body.get("plate") ?? null,
        officerId: ctx.get("activeOfficer").id,
      },
      include: {
        officer: true,
      },
    });

    this.socket.emitCreateBolo(bolo);

    return bolo;
  }

  @Use(ActiveOfficer)
  @Put("/:id")
  async updateBolo(
    @PathParams("id") id: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
  ) {
    const error = validate(CREATE_BOLO_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const bolo = await prisma.bolo.findUnique({
      where: { id },
    });

    if (!bolo) {
      throw new NotFound("boloNotFound");
    }

    const updated = await prisma.bolo.update({
      where: {
        id,
      },
      data: {
        description: body.get("description"),
        color: body.get("color") ?? null,
        name: body.get("name") ?? null,
        plate: body.get("plate") ?? null,
        officerId: ctx.get("activeOfficer").id,
      },
      include: {
        officer: true,
      },
    });

    this.socket.emitUpdateBolo(updated);

    return updated;
  }

  @Use(ActiveOfficer)
  @Delete("/:id")
  async deleteBolo(@PathParams("id") id: string) {
    const bolo = await prisma.bolo.findUnique({
      where: { id },
    });

    if (!bolo) {
      throw new NotFound("boloNotFound");
    }

    await prisma.bolo.delete({
      where: {
        id,
      },
    });

    this.socket.emitDeleteBolo(bolo);

    return true;
  }
}
