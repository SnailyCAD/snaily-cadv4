import { Controller } from "@tsed/di";
import { Description, Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/index";
import type { cad } from ".prisma/client";
import { Feature, User } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { UPDATE_AOP_SCHEMA, UPDATE_RADIO_CHANNEL_SCHEMA } from "@snailycad/schemas";
import { leoProperties, unitProperties, combinedUnitProperties } from "lib/leo/activeOfficer";
import { findUnit } from "./911-calls/Calls911Controller";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";

@Controller("/dispatch")
@UseBeforeEach(IsAuth)
export class DispatchController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getDispatchData() {
    const includeData = {
      include: {
        department: { include: { value: true } },
        status: { include: { value: true } },
        division: { include: { value: true } },
        citizen: {
          select: {
            name: true,
            surname: true,
            id: true,
          },
        },
      },
    };

    const officers = await prisma.officer.findMany({
      ...includeData,
    });

    const deputies = await prisma.emsFdDeputy.findMany({
      ...includeData,
    });

    const activeDispatchers = await prisma.activeDispatchers.findMany({
      include: {
        user: {
          select: { id: true, username: true, rank: true, isLeo: true, isEmsFd: true },
        },
      },
    });

    const activeIncidents = await prisma.leoIncident.findMany({
      where: { isActive: true },
      include: {
        creator: { include: leoProperties },
        officersInvolved: { include: leoProperties },
        events: true,
      },
    });

    return { deputies, officers, activeIncidents, activeDispatchers };
  }

  @Post("/aop")
  @Description("Update the AOP in the CAD")
  async updateAreaOfPlay(@Context("cad") cad: cad, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_AOP_SCHEMA, body);

    const updated = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        areaOfPlay: data.aop,
      },
      select: { areaOfPlay: true },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);

    return updated;
  }

  @Post("/signal-100")
  @Description("Enable or disable signal 100")
  async setSignal100(@Context("cad") cad: cad, @BodyParams("value") value: boolean) {
    if (typeof value !== "boolean") {
      throw new BadRequest("body.valueIsRequired");
    }

    await prisma.miscCadSettings.update({
      where: {
        id: cad.miscCadSettingsId!,
      },
      data: {
        signal100Enabled: value,
      },
    });

    this.socket.emitSignal100(value);

    return { value };
  }

  @Post("/dispatchers-state")
  @Description("Set a dispatcher active or inactive")
  async setActiveDispatchersState(@Context() ctx: Context, @BodyParams() body: any) {
    const cad = ctx.get("cad") as cad;
    const user = ctx.get("user") as User;
    const value = Boolean(body.value);

    if (cad.disabledFeatures.includes(Feature.ACTIVE_DISPATCHERS)) {
      throw new BadRequest("featureDisabled");
    }

    let dispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
    });

    if (value) {
      dispatcher =
        dispatcher ??
        (await prisma.activeDispatchers.create({
          data: { userId: user.id },
        }));
    } else {
      if (!dispatcher) {
        return;
      }

      dispatcher = await prisma.activeDispatchers.delete({
        where: { id: dispatcher.id },
      });
    }

    this.socket.emitActiveDispatchers();

    return { dispatcher };
  }

  @Put("/radio-channel/:unitId")
  async updateRadioChannel(@PathParams("unitId") unitId: string, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_RADIO_CHANNEL_SCHEMA, body);
    const { unit, type } = await findUnit(unitId, undefined, true);

    if (!unit) {
      throw new ExtendedNotFound({ radioChannel: "Unit not found" });
    }

    const includesData = {
      leo: { name: "officer", include: leoProperties },
      "ems-fd": { name: "emsFdDeputy", include: unitProperties },
      combined: { name: "combinedLeoUnit", include: combinedUnitProperties },
    };

    const name = includesData[type].name;
    const include = includesData[type].include;

    // @ts-expect-error the provided properties are the same for both models.
    const updated = await prisma[name].update({
      where: { id: unitId },
      data: {
        radioChannelId: data.radioChannel,
      },
      include,
    });

    if (["leo", "combined"].includes(type)) {
      this.socket.emitUpdateOfficerStatus();
    } else {
      this.socket.emitUpdateDeputyStatus();
    }

    return updated;
  }
}
