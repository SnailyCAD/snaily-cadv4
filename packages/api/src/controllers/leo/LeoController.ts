import { Res, Controller, UseBeforeEach, Use, Req } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, UPDATE_OFFICER_STATUS_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { cad, ShouldDoType, MiscCadSettings, User, Citizen } from ".prisma/client";
import { setCookie } from "../../utils/setCookie";
import { Cookie } from "@snailycad/config";
import { IsAuth } from "../../middlewares";
import { signJWT } from "../../utils/jwt";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";
import { Socket } from "../../services/SocketService";
import { getWebhookData, sendDiscordWebhook } from "../../lib/discord";
import { APIWebhook } from "discord-api-types/payloads/v9/webhook";

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
        citizen: {
          select: {
            name: true,
            surname: true,
            id: true,
          },
        },
      },
    });

    const citizens = await prisma.citizen.findMany({
      select: {
        name: true,
        surname: true,
        id: true,
      },
    });

    return { officers, citizens };
  }

  @Post("/")
  async createOfficer(@BodyParams() body: JsonRequestBody, @Context("user") user: User) {
    const error = validate(CREATE_OFFICER_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const division = await prisma.divisionValue.findFirst({
      where: {
        id: body.get("division"),
        departmentId: body.get("department"),
      },
    });

    if (!division) {
      throw new BadRequest("divisionNotInDepartment");
    }

    let citizen: null | Citizen = null;
    if (body.get("citizenId")) {
      citizen = await prisma.citizen.findFirst({
        where: {
          id: body.get("citizenId"),
          userId: user.id,
        },
      });

      if (!citizen) {
        throw new NotFound("citizenNotFound");
      }
    }

    const officer = await prisma.officer.create({
      data: {
        name: citizen ? `${citizen.name} ${citizen.surname}` : body.get("name"),
        callsign: body.get("callsign"),
        userId: user.id,
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        badgeNumber: parseInt(body.get("badgeNumber")),
        citizenId: citizen?.id ?? null,
      },
      include: {
        department: true,
        division: {
          include: {
            value: true,
          },
        },
        citizen: {
          select: {
            name: true,
            surname: true,
            id: true,
          },
        },
      },
    });

    return officer;
  }

  @Put("/:id")
  async updateOfficer(
    @PathParams("id") officerId: string,
    @BodyParams() body: JsonRequestBody,
    @Context("user") user: User,
  ) {
    const error = validate(CREATE_OFFICER_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const officer = await prisma.officer.findFirst({
      where: {
        id: officerId,
        userId: user.id,
      },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    const division = await prisma.divisionValue.findFirst({
      where: {
        id: body.get("division"),
        departmentId: body.get("department"),
      },
    });

    if (!division) {
      throw new BadRequest("divisionNotInDepartment");
    }

    let citizen: null | Citizen = null;
    if (body.get("citizenId")) {
      citizen = await prisma.citizen.findFirst({
        where: {
          id: body.get("citizenId"),
          userId: user.id,
        },
      });

      if (!citizen) {
        throw new NotFound("citizenNotFound");
      }
    }

    const updated = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        callsign: body.get("callsign"),
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        badgeNumber: parseInt(body.get("badgeNumber")),
        name: citizen ? `${citizen.name} ${citizen.surname}` : body.get("name"),
        citizenId: citizen?.id ?? null,
      },
      include: {
        department: true,
        division: {
          include: {
            value: true,
          },
        },
        citizen: {
          select: {
            name: true,
            surname: true,
            id: true,
          },
        },
      },
    });

    return updated;
  }

  @Put("/:id/status")
  async setOfficerStatus(
    @PathParams("id") officerId: string,
    @BodyParams() body: JsonRequestBody,
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @Res() res: Res,
    @Req() req: Req,
  ) {
    const error = validate(UPDATE_OFFICER_STATUS_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const statusId = body.get("status");

    const isFromDispatch = req.headers["is-from-dispatch"]?.toString() === "true";
    const isDispatch = isFromDispatch && user.isDispatch;

    const officer = await prisma.officer.findFirst({
      where: {
        userId: isDispatch ? undefined : user.id,
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
        id: statusId,
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
        userId: user.id,
      },
      data: {
        statusId: null,
      },
    });

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        statusId: code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id,
      },
      include: {
        department: true,
        status: {
          include: { value: true },
        },
      },
    });

    const officerLog = await prisma.officerLog.findFirst({
      where: {
        officerId: officer.id,
        endedAt: null,
      },
    });

    if (code.shouldDo === ShouldDoType.SET_ON_DUTY) {
      if (!officerLog) {
        await prisma.officerLog.create({
          data: {
            officerId: officer.id,
            userId: user.id,
            startedAt: new Date(),
          },
        });
      }
    } else {
      if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        // unassign officer from call
        await prisma.officer.update({
          where: {
            id: officer.id,
          },
          data: {
            call911Id: null,
          },
        });

        if (officerLog) {
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

    if (cad.discordWebhookURL) {
      const webhook = await getWebhookData(cad.discordWebhookURL);
      if (!webhook) return;
      const data = createWebhookData(webhook, updatedOfficer);

      await sendDiscordWebhook(webhook, data);
    }

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
        status: {
          NOT: {
            shouldDo: ShouldDoType.SET_OFF_DUTY,
          },
        },
      },
      include: {
        department: true,
        rank: true,
        division: {
          include: {
            value: true,
          },
        },
        status: {
          include: {
            value: true,
          },
        },
      },
    });

    return Array.isArray(officers) ? officers : [officers];
  }
}

export function createWebhookData(webhook: APIWebhook, officer: any) {
  const status2 = officer.status2.value.value;
  const department = officer.department.value;
  const officerName = `${officer.badgeNumber} - ${officer.name} ${officer.callsign} (${department})`;

  return {
    avatar_url: webhook.avatar,
    embeds: [
      {
        title: "Status Change",
        type: "rich",
        description: `Officer **${officerName}** has changed their status to ${status2}`,
        fields: [
          {
            name: "ON/OFF duty",
            value: officer.status,
            inline: true,
          },
          {
            name: "Status",
            value: status2,
            inline: true,
          },
        ],
      },
    ],
  };
}
