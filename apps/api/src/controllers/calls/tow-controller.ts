import { prisma } from "lib/data/prisma";
import { TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { AuthGuard } from "middlewares/auth/is-auth";
import { Socket } from "services/socket-service";
import { validateSchema } from "lib/data/validate-schema";
import {
  Citizen,
  DiscordWebhookType,
  Feature,
  RegisteredVehicle,
  User,
  Value,
  VehicleValue,
} from "@prisma/client";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import type * as APITypes from "@snailycad/types/api";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { getTranslator } from "utils/get-translator";
import { callInclude } from "~/utils/leo/includes";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";

const CITIZEN_SELECTS = {
  name: true,
  surname: true,
  id: true,
};

export const towIncludes = {
  assignedUnit: { select: CITIZEN_SELECTS },
  creator: { select: CITIZEN_SELECTS },
};

@Controller("/tow")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.TAXI })
export class TowController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the tow calls")
  @UsePermissions({
    permissions: [Permissions.ManageTowCalls, Permissions.ViewTowCalls, Permissions.ViewTowLogs],
  })
  async getTowCalls(@Query("ended") includingEnded = "false"): Promise<APITypes.GetTowCallsData> {
    const calls = await prisma.towCall.findMany({
      where: includingEnded === "true" ? undefined : { ended: false },
      include: towIncludes,
      orderBy: { createdAt: "desc" },
    });

    return calls;
  }

  @Post("/")
  @Description("Create a new tow call")
  async createTowCall(
    @Body() body: unknown,
    @SessionUser() user: User,
    @Cad() cad: { features?: Record<Feature, boolean> },
  ): Promise<APITypes.PostTowCallsData> {
    const data = validateSchema(TOW_SCHEMA, body);

    if (data.creatorId) {
      const extraWhere = data.plate
        ? {
            OR: [
              { officers: { some: { citizenId: data.creatorId } } },
              { emsFdDeputies: { some: { citizenId: data.creatorId } } },
            ],
          }
        : {};

      const citizen = await prisma.citizen.findFirst({
        where: {
          id: data.creatorId,
          ...extraWhere,
        },
      });

      const checkUserId = shouldCheckCitizenUserId({ cad, user });

      if (checkUserId) {
        canManageInvariant(citizen?.userId, user, new NotFoundException("notFound"));
      }
    }

    let vehicle;
    if (data.plate && data.deliveryAddressId) {
      vehicle = await prisma.registeredVehicle.findUnique({
        where: { plate: data.plate },
        include: { model: { include: { value: true } } },
      });

      if (!vehicle) {
        throw new NotFoundException("vehicleNotFound");
      }

      await prisma.impoundedVehicle.create({
        data: {
          valueId: data.deliveryAddressId,
          registeredVehicleId: vehicle.id,
        },
      });

      const impoundedVehicle = await prisma.registeredVehicle.update({
        where: {
          id: vehicle.id,
        },
        data: {
          impounded: true,
        },
        include: {
          model: { include: { value: true } },
          registrationStatus: true,
          citizen: true,
        },
      });

      try {
        const data = await createVehicleImpoundedWebhookData(impoundedVehicle, user.locale);
        await sendDiscordWebhook({ type: DiscordWebhookType.VEHICLE_IMPOUNDED, data });
        await sendRawWebhook({
          type: DiscordWebhookType.VEHICLE_IMPOUNDED,
          data: impoundedVehicle,
        });
      } catch (error) {
        console.error("Could not send Discord webhook.", error);
      }

      if (data.call911Id) {
        const call = await prisma.call911.findUnique({
          where: { id: data.call911Id },
          include: callInclude,
        });

        if (call) {
          const event = await prisma.call911Event.create({
            data: {
              description: "Created a tow call",
              call911Id: data.call911Id,
            },
          });

          const normalizedCall = officerOrDeputyToUnit({
            ...call,
            events: [...call.events, event],
          });

          this.socket.emitUpdate911Call(normalizedCall);
        }
      }
    }

    const call = await prisma.towCall.create({
      data: {
        creatorId: data.creatorId || null,
        description: data.description,
        descriptionData: data.descriptionData || undefined,
        location: data.location,
        postal: data.postal,
        deliveryAddressId: data.deliveryAddressId || undefined,
        plate: vehicle?.plate.toUpperCase() ?? null,
        model: vehicle?.model.value.value ?? null,
        ended: data.callCountyService ?? false,
        name: data.name ?? null,
        callCountyService: data.callCountyService,
      },
      include: towIncludes,
    });

    if (call.ended) {
      this.socket.emitTowCallEnd(call);
    } else {
      this.socket.emitTowCall(call);
    }

    return call;
  }

  @Put("/:id")
  @Description("Update a tow call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTowCalls],
  })
  async updateCall(
    @Param("id") callId: string,
    @Body() body: unknown,
  ): Promise<APITypes.PutTowCallsData> {
    const data = validateSchema(UPDATE_TOW_SCHEMA, body);

    const call = await prisma.towCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException("notFound");
    }

    const rawAssignedUnitId = data.assignedUnitId;
    const assignedUnitId =
      rawAssignedUnitId === null
        ? { disconnect: true }
        : data.assignedUnitId
        ? { connect: { id: data.assignedUnitId } }
        : undefined;

    const updated = await prisma.towCall.update({
      where: { id: callId },
      data: {
        description: data.description,
        descriptionData: data.descriptionData || undefined,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
        assignedUnit: assignedUnitId,
        name: data.name ?? null,
      },
      include: towIncludes,
    });

    this.socket.emitUpdateTowCall(updated);

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a tow call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTowCalls],
  })
  async endTowCall(@Param("id") callId: string): Promise<APITypes.DeleteTowCallsData> {
    const call = await prisma.towCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException("notFound");
    }

    const updated = await prisma.towCall.update({
      where: { id: call.id },
      data: { ended: true },
      include: towIncludes,
    });

    this.socket.emitTowCallEnd(updated);

    return true;
  }
}

export async function createVehicleImpoundedWebhookData(
  vehicle: RegisteredVehicle & {
    model: VehicleValue & { value: Value };
    registrationStatus: Value;
    citizen?: Pick<Citizen, "name" | "surname"> | null;
  },
  locale?: string | null,
) {
  const t = await getTranslator({ type: "webhooks", locale, namespace: "Tow" });
  const common = await getTranslator({ type: "common", locale, namespace: "Common" });

  return {
    embeds: [
      {
        title: t("vehicleImpounded"),
        fields: [
          { name: t("registrationStatus"), value: vehicle.registrationStatus.value, inline: true },
          { name: t("model"), value: vehicle.model.value.value, inline: true },
          {
            name: t("owner"),
            value: vehicle.citizen
              ? `${vehicle.citizen.name} ${vehicle.citizen.surname}`
              : common("unknown"),
            inline: true,
          },
        ],
      },
    ],
  };
}
