import {
  Res,
  Controller,
  UseBeforeEach,
  Use,
  Req,
  PlatformMulterFile,
  MultipartFile,
  UseBefore,
} from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, UPDATE_OFFICER_STATUS_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Officer, cad, ShouldDoType, MiscCadSettings, User } from ".prisma/client";
import { setCookie } from "../../utils/setCookie";
import { AllowedFileExtension, allowedFileExtensions, Cookie } from "@snailycad/config";
import { IsAuth, IsLeo } from "../../middlewares";
import { signJWT } from "../../utils/jwt";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";
import { Socket } from "../../services/SocketService";
import { getWebhookData, sendDiscordWebhook } from "../../lib/discord";
import { APIWebhook } from "discord-api-types/payloads/v9/webhook";
import fs from "node:fs";
import { unitProperties } from "../../lib/officer";

// todo: check for leo permissions
@Controller("/leo")
@UseBeforeEach(IsAuth)
export class LeoController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @UseBefore(IsLeo)
  @Get("/")
  async getUserOfficers(@Context() ctx: Context) {
    const officers = await prisma.officer.findMany({
      where: {
        userId: ctx.get("user").id,
      },
      include: unitProperties,
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

  @UseBefore(IsLeo)
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

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: body.get("citizenId"),
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const officer = await prisma.officer.create({
      data: {
        callsign: body.get("callsign"),
        callsign2: body.get("callsign2"),
        userId: user.id,
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        badgeNumber: parseInt(body.get("badgeNumber")),
        citizenId: citizen.id,
      },
      include: unitProperties,
    });

    return officer;
  }

  @UseBefore(IsLeo)
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

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: body.get("citizenId"),
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const updated = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        callsign: body.get("callsign"),
        callsign2: body.get("callsign2"),
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        badgeNumber: parseInt(body.get("badgeNumber")),
        citizenId: citizen.id,
      },
      include: unitProperties,
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
      include: unitProperties,
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
        await prisma.assignedUnit.deleteMany({
          where: {
            officerId: officer.id,
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

  @UseBefore(IsLeo)
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

  @UseBefore(IsLeo)
  @Get("/logs")
  async getOfficerLogs(@Context() ctx: Context) {
    const logs = await prisma.officerLog.findMany({
      where: {
        userId: ctx.get("user").id,
      },
      include: {
        officer: {
          include: unitProperties,
        },
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
      include: unitProperties,
    });

    return Array.isArray(officers) ? officers : [officers];
  }

  @UseBefore(IsLeo)
  @Post("/image/:id")
  async uploadImageToOfficer(
    @Context("user") user: User,
    @PathParams("id") officerId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const officer = await prisma.officer.findFirst({
      where: {
        userId: user.id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("Not Found");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/units/${officer.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.officer.update({
      where: {
        id: officerId,
      },
      data: {
        imageId: `${officer.id}.${extension}`,
      },
      select: {
        imageId: true,
      },
    });

    return data;
  }

  @Post("/panic-button")
  @Use(ActiveOfficer)
  async panicButton(@Context("activeOfficer") officer: Officer) {
    const fullOfficer = await prisma.officer.findUnique({
      where: {
        id: officer.id,
      },
      include: unitProperties,
    });

    this.socket.emitPanicButtonLeo(fullOfficer);
  }
}

export function createWebhookData(webhook: APIWebhook, officer: any) {
  const status = officer.status.value.value;
  const department = officer.department.value.value;
  const officerName = `${officer.badgeNumber} - ${officer.name} ${officer.callsign} (${department})`;

  return {
    avatar_url: webhook.avatar,
    embeds: [
      {
        title: "Status Change",
        type: "rich",
        description: `Officer **${officerName}** has changed their status to ${status}`,
        fields: [
          {
            name: "Status",
            value: status,
            inline: true,
          },
        ],
      },
    ],
  };
}
