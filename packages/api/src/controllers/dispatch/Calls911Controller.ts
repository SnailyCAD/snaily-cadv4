import { Controller } from "@tsed/di";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { CREATE_911_CALL, validate } from "@snailycad/schemas";
import { BodyParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Socket } from "../../services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "../../middlewares";

@Controller("/911-calls")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async get911Calls() {
    const calls = await prisma.call911.findMany({
      include: {
        assignedUnits: true,
      },
    });

    return calls;
  }

  @Post("/")
  async create911Call(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_911_CALL, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const call = await prisma.call911.create({
      data: {
        location: body.get("location"),
        description: body.get("description"),
        name: body.get("name"),
        userId: ctx.get("user").id,
      },
      include: {
        assignedUnits: true,
      },
    });

    this.socket.emit911Call(call);

    return call;
  }
}
