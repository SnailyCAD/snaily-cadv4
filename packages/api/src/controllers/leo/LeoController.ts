import {
  Controller,
  UseBeforeEach,
  PlatformMulterFile,
  MultipartFile,
  UseBefore,
} from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, LICENSE_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Officer, ShouldDoType, User } from ".prisma/client";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { IsAuth } from "middlewares/index";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Socket } from "services/SocketService";
import fs from "node:fs";
import { unitProperties } from "lib/officer";
import { citizenInclude } from "controllers/citizen/CitizenController";

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
        imageId: body.get("image") || undefined,
      },
      include: unitProperties,
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
        imageId: body.get("image") || undefined,
      },
      include: unitProperties,
    });

    return updated;
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

  @UseBefore(ActiveOfficer)
  @Get("/active-officer")
  async getActiveOfficer(@Context() ctx: Context) {
    return ctx.get("activeOfficer");
  }

  @Get("/active-officers")
  async getActiveOfficers() {
    const [officers, units] = await Promise.all([
      await prisma.officer.findMany({
        where: {
          status: {
            NOT: {
              shouldDo: ShouldDoType.SET_OFF_DUTY,
            },
          },
        },
        include: unitProperties,
      }),
      await prisma.combinedLeoUnit.findMany({
        include: {
          status: { include: { value: true } },
          officers: { include: unitProperties },
        },
      }),
    ]);

    return [...officers, ...units];
  }

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
  @UseBefore(ActiveOfficer)
  async panicButton(@Context("activeOfficer") officer: Officer) {
    let fullOfficer = await prisma.officer.findUnique({
      where: {
        id: officer.id,
      },
      include: unitProperties,
    });

    const code = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.PANIC_BUTTON,
      },
    });

    if (code) {
      fullOfficer = await prisma.officer.update({
        where: {
          id: officer.id,
        },
        data: {
          statusId: code.id,
        },
        include: unitProperties,
      });
    }

    this.socket.emitUpdateOfficerStatus();
    this.socket.emitPanicButtonLeo(fullOfficer);
  }

  @Get("/impounded-vehicles")
  async getImpoundedVehicles() {
    const vehicles = await prisma.impoundedVehicle.findMany({
      include: {
        location: true,
        vehicle: {
          include: { model: { include: { value: true } } },
        },
      },
    });

    return vehicles;
  }

  @Put("/licenses/:citizenId")
  async updateCitizenLicenses(
    @BodyParams() body: JsonRequestBody,
    @PathParams("citizenId") citizenId: string,
  ) {
    const error = validate(LICENSE_SCHEMA, body.toJSON(), true);
    if (error) {
      return new BadRequest(error);
    }

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
        ccwId: body.get("ccw"),
        driversLicenseId: body.get("driversLicense"),
        pilotLicenseId: body.get("pilotLicense"),
        weaponLicenseId: body.get("weaponLicense"),
      },
      include: citizenInclude,
    });

    return updated;
  }

  @Delete("/impounded-vehicles/:id")
  async checkoutImpoundedVehicle(@PathParams("id") id: string) {
    const vehicle = await prisma.impoundedVehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    await prisma.impoundedVehicle.delete({
      where: {
        id,
      },
    });

    await prisma.registeredVehicle.update({
      where: {
        id: vehicle.registeredVehicleId,
      },
      data: { impounded: false },
    });

    return true;
  }
}
