import {
  Res,
  Controller,
  UseBeforeEach,
  Use,
  Req,
  MultipartFile,
  PlatformMulterFile,
  UseBefore,
} from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import {
  CREATE_OFFICER_SCHEMA,
  MEDICAL_RECORD_SCHEMA,
  UPDATE_OFFICER_STATUS_SCHEMA,
  validate,
} from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { cad, ShouldDoType, MiscCadSettings, User } from ".prisma/client";
import { setCookie } from "../../utils/setCookie";
import { AllowedFileExtension, allowedFileExtensions, Cookie } from "@snailycad/config";
import { IsAuth, IsEmsFd } from "../../middlewares";
import { signJWT } from "../../utils/jwt";
import { Socket } from "../../services/SocketService";
import { getWebhookData, sendDiscordWebhook } from "../../lib/discord";
import { APIWebhook } from "discord-api-types/payloads/v9/webhook";
import { ActiveDeputy } from "../../middlewares/ActiveDeputy";
import fs from "node:fs";

@Controller("/ems-fd")
@UseBeforeEach(IsAuth)
export class EmsFdController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @UseBefore(IsEmsFd)
  @Get("/")
  async getUserDeputies(@Context("user") user: User) {
    const deputies = await prisma.emsFdDeputy.findMany({
      where: {
        userId: user.id,
      },
      include: {
        department: { include: { value: true } },
        division: { include: { value: true } },
      },
    });

    const citizens = await prisma.citizen.findMany({
      select: {
        name: true,
        surname: true,
        id: true,
      },
    });

    return { deputies, citizens };
  }

  @UseBefore(IsEmsFd)
  @Post("/")
  async createEmsFdDeputy(@BodyParams() body: JsonRequestBody, @Context("user") user: User) {
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

    const deputy = await prisma.emsFdDeputy.create({
      data: {
        name: body.get("name"),
        callsign: body.get("callsign"),
        callsign2: body.get("callsign2"),
        userId: user.id,
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        badgeNumber: parseInt(body.get("badgeNumber")),
      },
      include: {
        department: { include: { value: true } },
        division: { include: { value: true } },
      },
    });

    return deputy;
  }

  @UseBefore(IsEmsFd)
  @Put("/:id")
  async updateDeputy(
    @PathParams("id") deputyId: string,
    @BodyParams() body: JsonRequestBody,
    @Context("user") user: User,
  ) {
    const error = validate(CREATE_OFFICER_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        id: deputyId,
        userId: user.id,
      },
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
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

    const updated = await prisma.emsFdDeputy.update({
      where: {
        id: deputy.id,
      },
      data: {
        name: body.get("name"),
        callsign: body.get("callsign"),
        callsign2: body.get("callsign2"),
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        badgeNumber: parseInt(body.get("badgeNumber")),
      },
      include: {
        department: { include: { value: true } },
        division: { include: { value: true } },
      },
    });

    return updated;
  }

  @Put("/:id/status")
  async setDeputyStatus(
    @PathParams("id") deputyId: string,
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

    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: isDispatch ? undefined : user.id,
        id: deputyId,
      },
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
    }

    if (deputy.suspended) {
      throw new BadRequest("deputySuspended");
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

    // reset all user
    await prisma.emsFdDeputy.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        statusId: null,
      },
    });

    const updatedDeputy = await prisma.emsFdDeputy.update({
      where: {
        id: deputy.id,
      },
      data: {
        statusId: code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id,
      },
      include: {
        department: { include: { value: true } },
        rank: true,
        division: { include: { value: true } },
        status: { include: { value: true } },
      },
    });

    if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      setCookie({
        res,
        name: Cookie.ActiveDeputy,
        value: "",
        expires: -1,
      });

      // unassign deputy from call
      await prisma.assignedUnit.deleteMany({
        where: {
          emsFdDeputyId: deputy.id,
        },
      });
    } else {
      // expires after 3 hours.
      setCookie({
        res,
        name: Cookie.ActiveDeputy,
        value: signJWT({ deputyId: updatedDeputy.id }, 60 * 60 * 3),
        expires: 60 * 60 * 1000 * 3,
      });
    }

    if (cad.discordWebhookURL) {
      const webhook = await getWebhookData(cad.discordWebhookURL);
      if (!webhook) return;
      const data = createWebhookData(webhook, updatedDeputy);

      await sendDiscordWebhook(webhook, data);
    }

    this.socket.emitUpdateDeputyStatus();

    return updatedDeputy;
  }

  @UseBefore(IsEmsFd)
  @Delete("/:id")
  async deleteDeputy(@PathParams("id") id: string, @Context() ctx: Context) {
    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: ctx.get("user").id,
        id,
      },
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
    }

    await prisma.emsFdDeputy.delete({
      where: {
        id: deputy.id,
      },
    });

    return true;
  }

  @Use(ActiveDeputy)
  @Get("/active-deputy")
  async getActiveDeputy(@Context() ctx: Context) {
    return ctx.get("activeDeputy");
  }

  @Get("/active-deputies")
  async getActiveDeputies() {
    const deputies = await prisma.emsFdDeputy.findMany({
      where: {
        status: {
          NOT: {
            shouldDo: ShouldDoType.SET_OFF_DUTY,
          },
        },
      },
      include: {
        department: { include: { value: true } },
        rank: true,
        division: { include: { value: true } },
        status: { include: { value: true } },
      },
    });

    return Array.isArray(deputies) ? deputies : [deputies];
  }
  @Use(ActiveDeputy)
  @Post("/medical-record")
  async createMedicalRecord(@BodyParams() body: JsonRequestBody) {
    const error = validate(MEDICAL_RECORD_SCHEMA, body.toJSON(), true);

    if (error) {
      return new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: citizen.userId,
        type: body.get("type"),
        description: body.get("description"),
      },
    });

    return medicalRecord;
  }

  @Use(ActiveDeputy)
  @Post("/declare/:citizenId")
  async declareCitizenDeadOrAlive(@PathParams("citizenId") citizenId: string) {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        dead: !citizen.dead,
        dateOfDead: citizen.dead ? null : new Date(),
      },
    });

    return updated;
  }

  @UseBefore(IsEmsFd)
  @Post("/image/:id")
  async uploadImageToOfficer(
    @Context("user") user: User,
    @PathParams("id") deputyId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: user.id,
        id: deputyId,
      },
    });

    if (!deputy) {
      throw new NotFound("Not Found");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/units/${deputy.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.emsFdDeputy.update({
      where: {
        id: deputyId,
      },
      data: {
        imageId: `${deputy.id}.${extension}`,
      },
      select: {
        imageId: true,
      },
    });

    return data;
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
