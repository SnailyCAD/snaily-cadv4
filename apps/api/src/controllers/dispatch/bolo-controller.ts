import { Controller } from "@tsed/di";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { CREATE_BOLO_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { Use, UseAfter, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/is-auth";
import { ActiveOfficer } from "middlewares/active-officer";
import { Socket } from "services/socket-service";
import { leoProperties } from "lib/leo/activeOfficer";
import { validateSchema } from "lib/data/validate-schema";
import {
  Bolo,
  BoloType,
  CombinedLeoUnit,
  DiscordWebhookType,
  Officer,
  Prisma,
} from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type { APIEmbed } from "discord-api-types/v10";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import { getFirstOfficerFromActiveOfficer, getInactivityFilter } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";
import type { cad } from "@snailycad/types";
import { getTranslator } from "utils/get-translator";
import { HandleInactivity } from "middlewares/handle-inactivity";

@Controller("/bolos")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
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
  @UseAfter(HandleInactivity)
  @Description("Get all the bolos")
  async getBolos(
    @Context("cad") cad: cad,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
    @QueryParams("type", String) boloType?: BoloType,
  ): Promise<APITypes.GetBolosData> {
    const inactivityFilter = getInactivityFilter(cad, "boloInactivityTimeout");

    const where: Prisma.BoloWhereInput = query
      ? {
          OR: [
            { plate: { contains: query.trim(), mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { color: { contains: query, mode: "insensitive" } },
            { plate: { contains: query, mode: "insensitive" } },
            { model: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    if (boloType) {
      if (!(boloType in BoloType)) {
        throw new BadRequest(
          `invalid boloType provided. Must be one of: ${Object.values(BoloType)}`,
        );
      }

      where.type = boloType;
    }

    const [boloCount, bolos] = await prisma.$transaction([
      prisma.bolo.count({ where: { ...inactivityFilter?.filter, ...where } }),
      prisma.bolo.findMany({
        orderBy: { updatedAt: "desc" },
        take: includeAll ? undefined : 12,
        skip: includeAll ? undefined : skip,
        where: { ...inactivityFilter?.filter, ...where },
        include: {
          officer: {
            include: leoProperties,
          },
        },
      }),
    ]);

    return { bolos, totalCount: boloCount };
  }

  @Use(ActiveOfficer)
  @Post("/")
  @Description("Create a new BOLO")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
  async createBolo(
    @BodyParams() body: unknown,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ): Promise<APITypes.PostBolosData> {
    const data = validateSchema(CREATE_BOLO_SCHEMA, body);
    const officer = getFirstOfficerFromActiveOfficer({ allowDispatch: true, activeOfficer });

    const bolo = await prisma.bolo.create({
      data: {
        description: data.description,
        type: data.type as BoloType,
        color: data.color ?? null,
        name: data.name ?? null,
        plate: data.plate ?? null,
        model: data.model ?? null,
        officerId: officer?.id ?? null,
      },
      include: {
        officer: {
          include: leoProperties,
        },
      },
    });

    try {
      const embed = await createBoloEmbed(bolo);
      await sendDiscordWebhook({ type: DiscordWebhookType.BOLO, data: embed });
      await sendRawWebhook({ type: DiscordWebhookType.BOLO, data: bolo });
    } catch (error) {
      console.error("[cad_bolo]: Could not send Discord webhook.", error);
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
  async updateBolo(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutBolosData> {
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
        type: (data.type || bolo.type) as BoloType,
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
  async deleteBolo(@PathParams("id") id: string): Promise<APITypes.DeleteBolosData> {
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
  async reportVehicleStolen(@BodyParams() body: any): Promise<APITypes.PostMarkStolenData> {
    const { id, color, plate, value } = body;

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id },
      include: { model: { include: { value: true } } },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    const isStolen = typeof value === "boolean" ? value : true;

    await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: { reportedStolen: isStolen },
    });

    let bolo: Bolo | undefined;

    if (isStolen) {
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
    }

    return bolo ?? true;
  }
}

async function createBoloEmbed(bolo: Bolo): Promise<{ embeds: APIEmbed[] }> {
  const translator = await getTranslator({ type: "webhooks", namespace: "Bolos", locale: "en" });

  const type = bolo.type.toLowerCase();
  const name = bolo.name || "—";
  const plate = bolo.plate?.toUpperCase() || "—";
  const model = bolo.model || "—";
  const color = bolo.color || "—";
  const description = bolo.description || "—";

  return {
    embeds: [
      {
        title: translator("boloCreated"),
        description,
        footer: { text: translator("viewMoreInfo") },
        fields: [
          { name: translator("type"), value: type, inline: true },
          { name: translator("name"), value: name, inline: true },
          { name: translator("plate"), value: plate, inline: true },
          { name: translator("model"), value: model, inline: true },
          { name: translator("color"), value: color, inline: true },
        ],
      },
    ],
  };
}
