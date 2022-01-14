import { Controller } from "@tsed/di";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { BodyParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/index";
import { cad } from ".prisma/client";
import { Feature, User } from "@prisma/client";

@Controller("/dispatch")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
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

    return { deputies, officers, activeDispatchers };
  }

  @Post("/aop")
  async updateAreaOfPlay(@Context("cad") cad: cad, @BodyParams() body: JsonRequestBody) {
    if (!body.get("aop")) {
      throw new BadRequest("body.aopIsRequired");
    }

    const updated = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        areaOfPlay: body.get("aop"),
      },
      select: { areaOfPlay: true },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);

    return updated;
  }

  @Post("/signal-100")
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
  async setActiveDispatchersState(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const cad = ctx.get("cad") as cad;
    const user = ctx.get("user") as User;
    const value = Boolean(body.get("value"));

    if (cad.disabledFeatures.includes(Feature.ACTIVE_DISAPTCHERS)) {
      throw new BadRequest("featureDisabled");
    }

    let dispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
    });

    if (value === true) {
      dispatcher = await prisma.activeDispatchers.create({
        data: { userId: user.id },
      });
    } else {
      if (!dispatcher) {
        return;
      }

      dispatcher = await prisma.activeDispatchers.delete({
        where: { id: dispatcher.id },
      });
    }

    if (!dispatcher) {
      dispatcher = await prisma.activeDispatchers.create({
        data: { userId: user.id },
      });
    }

    this.socket.emitActiveDispatchers();

    return { dispatcher };
  }
}
