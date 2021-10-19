import { Res, Controller, UseBeforeEach, Use } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, UPDATE_OFFICER_STATUS_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { ShouldDoType, StatusEnum, MiscCadSettings } from ".prisma/client";
import { setCookie } from "../../utils/setCookie";
import { Cookie } from "@snailycad/config";
import { IsAuth } from "../../middlewares";
import { signJWT } from "../../utils/jwt";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";
import { Socket } from "../../services/SocketService";

// todo: check for leo permissions
@Controller("/leo")
@UseBeforeEach(IsAuth)
export class LeoController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getUserOfficers(@Context() ctx: Context) {
    const officers = await prisma.officer.findMany({
      where: {
        userId: ctx.get("user").id,
      },
      include: {
        division: {
          include: {
            value: true,
          },
        },
        department: true,
      },
    });

    return officers;
  }

  @Post("/")
  async createOfficer(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_OFFICER_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const officer = await prisma.officer.create({
      data: {
        name: body.get("name"),
        callsign: body.get("callsign"),
        userId: ctx.get("user").id,
        // rankId: body.get("rank"),
        departmentId: body.get("department"),
        divisionId: body.get("division"),
      },
      include: {
        department: true,
      },
    });

    return officer;
  }

  @Put("/:id/status")
  async setOfficerStatus(
    @PathParams("id") officerId: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
    @Res() res: Res,
  ) {
    const error = validate(UPDATE_OFFICER_STATUS_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const officer = await prisma.officer.findFirst({
      where: {
        //   todo: allow dispatch to use this route
        userId: ctx.get("user").id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    if (officer.suspended) {
      throw new BadRequest("officerSuspended");
    }

    const code = await prisma.statusValue.findFirst({
      where: {
        value: {
          value: body.get("status2"),
        },
      },
      include: {
        value: true,
      },
    });

    if (!code) {
      throw new NotFound("statusNotFound");
    }

    // reset all officers for user
    await prisma.officer.updateMany({
      where: {
        userId: ctx.get("user").id,
      },
      data: {
        status: "OFF_DUTY",
        status2Id: null,
      },
    });

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        status: body.get("status"),
        status2Id: code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id,
      },
      include: {
        department: true,
        status2: {
          include: { value: true },
        },
      },
    });

    const { miscCadSettings } = ctx.get("cad") as { miscCadSettings: MiscCadSettings };
    const officerLog = await prisma.officerLog.findFirst({
      where: {
        officerId: officer.id,
        endedAt: null,
      },
    });

    if ((miscCadSettings.onDutyCode ?? "10-8") === code.value.value) {
      if (!officerLog) {
        await prisma.officerLog.create({
          data: {
            officerId: officer.id,
            userId: ctx.get("user").id,
            startedAt: new Date(),
          },
        });
      }
    } else {
      if (code.shouldDo === ShouldDoType.SET_OFF_DUTY && officerLog) {
        await prisma.officerLog.update({
          where: {
            id: officerLog.id,
          },
          data: {
            endedAt: new Date(),
          },
        });
      }
    }

    if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      setCookie({
        res,
        name: Cookie.ActiveOfficer,
        value: "",
        expires: -1,
      });
    } else {
      // expires after 3 hours.
      setCookie({
        res,
        name: Cookie.ActiveOfficer,
        value: signJWT({ officerId: updatedOfficer.id }, 60 * 60 * 3),
        expires: 60 * 60 * 1000 * 3,
      });
    }

    // todo: send webhook
    // todo: update sockets
    this.socket.emitUpdateOfficerStatus();

    return updatedOfficer;
  }

  @Delete("/:id")
  async deleteOfficer(@PathParams("id") officerId: string, @Context() ctx: Context) {
    const officer = await prisma.officer.findFirst({
      where: {
        userId: ctx.get("user").id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    await prisma.officer.delete({
      where: {
        id: officer.id,
      },
    });

    return true;
  }

  @Get("/logs")
  async getOfficerLogs(@Context() ctx: Context) {
    const logs = await prisma.officerLog.findMany({
      where: {
        userId: ctx.get("user").id,
      },
      include: {
        officer: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return logs;
  }

  @Use(ActiveOfficer)
  @Get("/active-officer")
  async getActiveOfficer(@Context() ctx: Context) {
    return ctx.get("activeOfficer");
  }

  @Use(ActiveOfficer)
  @Get("/active-officers")
  async getActiveOfficers() {
    const officers = await prisma.officer.findMany({
      where: {
        status: StatusEnum.ON_DUTY,
      },
      include: {
        department: true,
        rank: true,
        status2: {
          include: {
            value: true,
          },
        },
      },
    });

    return officers;
  }
}
