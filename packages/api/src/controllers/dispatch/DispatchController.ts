import { Controller } from "@tsed/di";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { BodyParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Socket } from "../../services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "../../middlewares";
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
    const officers = await prisma.officer.findMany({
      include: {
        department: true,
        status2: {
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
    });

    return officers;
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
}
