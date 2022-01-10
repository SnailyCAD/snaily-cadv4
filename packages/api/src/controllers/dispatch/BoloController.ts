import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_BOLO_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Use, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/index";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Socket } from "services/SocketService";
import { leoProperties } from "lib/officer";

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
        officer: {
          include: leoProperties,
        },
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
        model: body.get("model") ?? null,
        officerId: ctx.get("activeOfficer")?.id ?? null,
      },
      include: {
        officer: {
          include: leoProperties,
        },
      },
    });

    this.socket.emitCreateBolo(bolo);

    return bolo;
  }

  @Use(ActiveOfficer)
  @Put("/:id")
  async updateBolo(@PathParams("id") id: string, @BodyParams() body: JsonRequestBody) {
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
        model: body.get("model") ?? null,
      },
      include: {
        officer: {
          include: leoProperties,
        },
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

  @Use(ActiveOfficer)
  @Post("/mark-stolen/:id")
  async reportVehicleStolen(@BodyParams() body: JsonRequestBody) {
    const { id, color, modelId, plate } = body.toJSON();

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        reportedStolen: true,
      },
    });

    const bolo = await prisma.bolo.create({
      data: {
        description: "stolen",
        type: "VEHICLE",
        color: color || null,
        model: modelId || null,
        plate: plate || null,
      },
    });

    this.socket.emitCreateBolo(bolo);

    return bolo;
  }
}
