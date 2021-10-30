import { Controller } from "@tsed/di";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { BodyParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Socket } from "../../services/SocketService";
import { UseBefore, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth, IsDispatch } from "../../middlewares";
import { cad } from ".prisma/client";

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
        status: {
          include: {
            value: true,
          },
        },
        division: {
          include: {
            value: true,
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

    return { deputies, officers };
  }

  @UseBefore(IsDispatch)
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

  @UseBefore(IsDispatch)
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
}
