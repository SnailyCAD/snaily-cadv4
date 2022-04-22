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
import { Bolo, BoloType, cad, MiscCadSettings } from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type { APIEmbed } from "discord-api-types/v10";
import { sendDiscordWebhook } from "lib/discord/webhooks";

@Controller("/bolos")
@UseBeforeEach(IsAuth)
export class BoloController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
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
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
  async createBolo(@BodyParams() body: unknown, @Context() ctx: Context) {
    const data = validateSchema(CREATE_BOLO_SCHEMA, body);
    const cad = ctx.get("cad") as cad & { miscCadSettings: MiscCadSettings | null };

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

    if (cad.miscCadSettings?.boloWebhookId) {
      try {
        const embed = createBoloEmbed(bolo);
        await sendDiscordWebhook(cad.miscCadSettings, "boloWebhookId", embed);
      } catch (error) {
        console.error("[cad_bolo]: Could not send Discord webhook.", error);
      }
    }

    this.socket.emitCreateBolo(bolo);

    return bolo;
  }

  @Use(ActiveOfficer)
  @Put("/:id")
  @Description("Update a BOLO by its id")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
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
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
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
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
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

    let existingId = "";
    if (plate) {
      const existing = await prisma.bolo.findFirst({
        where: { plate, type: BoloType.VEHICLE, description: "stolen" },
      });

      if (existing) {
        existingId = existing.id;
      }
    }

    const data = {
      description: "stolen",
      type: BoloType.VEHICLE,
      color: color || null,
      model: vehicle?.model?.value?.value ?? null,
      plate: plate || null,
    };

    const bolo = await prisma.bolo.upsert({
      where: { id: existingId },
      create: data,
      update: data,
    });

    this.socket.emitCreateBolo(bolo);

    return bolo;
  }
}

function createBoloEmbed(bolo: Bolo): { embeds: APIEmbed[] } {
  const type = bolo.type.toLowerCase();
  const name = bolo.name || "—";
  const plate = bolo.plate?.toUpperCase() || "—";
  const model = bolo.model || "—";
  const color = bolo.color || "—";
  const description = bolo.description || "—";

  return {
    embeds: [
      {
        title: "Bolo Created",
        description,
        footer: { text: "View more information on the CAD" },
        fields: [
          { name: "Type", value: type, inline: true },
          { name: "Name", value: name, inline: true },
          { name: "Plate", value: plate, inline: true },
          { name: "Model", value: model, inline: true },
          { name: "Color", value: color, inline: true },
        ],
      },
    ],
  };
}
