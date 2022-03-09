import { Controller } from "@tsed/di";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { CREATE_BOLO_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Use, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/IsAuth";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Socket } from "services/SocketService";
import { leoProperties } from "lib/leo/activeOfficer";
import { validateSchema } from "lib/validateSchema";
import type { BoloType } from "@prisma/client";

@Controller("/bolos")
@UseBeforeEach(IsAuth)
export class BoloController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the bolos")
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
  @Description("Create a new BOLO")
  async createBolo(@BodyParams() body: unknown, @Context() ctx: Context) {
    const data = validateSchema(CREATE_BOLO_SCHEMA, body);

    const bolo = await prisma.bolo.create({
      data: {
        description: data.description,
        type: data.type as BoloType,
        color: data.color ?? null,
        name: data.name ?? null,
        plate: data.plate ?? null,
        model: data.model ?? null,
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
  @Description("Update a BOLO by its id")
  async updateBolo(@PathParams("id") id: string, @BodyParams() body: unknown) {
    const data = validateSchema(CREATE_BOLO_SCHEMA, body);

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
        description: data.description,
        color: data.color ?? null,
        name: data.name ?? null,
        plate: data.plate ?? null,
        model: data.model ?? null,
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
  @Description("Delete a BOLO by its id")
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
  @Description("Mark a vehicle as stolen by its id")
  async reportVehicleStolen(@BodyParams() body: any) {
    const { id, color, plate } = body;

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id },
      include: { model: { include: { value: true } } },
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
        model: vehicle?.model?.value?.value ?? null,
        plate: plate || null,
      },
    });

    this.socket.emitCreateBolo(bolo);

    return bolo;
  }
}
