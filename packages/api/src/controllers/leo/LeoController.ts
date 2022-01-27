import process from "node:process";
import {
  Controller,
  UseBeforeEach,
  PlatformMulterFile,
  MultipartFile,
  UseBefore,
} from "@tsed/common";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, LICENSE_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Officer, ShouldDoType, User } from ".prisma/client";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { IsAuth } from "middlewares/index";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Socket } from "services/SocketService";
import fs from "node:fs";
import { leoProperties } from "lib/officer";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateImgurURL } from "utils/image";
import type { DivisionValue, MiscCadSettings } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";

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
      include: leoProperties,
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
  async createOfficer(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
  ) {
    const data = validateSchema(CREATE_OFFICER_SCHEMA, body);

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    await validateMaxDivisionsPerOfficer(data.divisions, cad);

    const officerCount = await prisma.officer.count({
      where: { userId: user.id },
    });

    if (
      cad.miscCadSettings.maxOfficersPerUser &&
      officerCount >= cad.miscCadSettings.maxOfficersPerUser
    ) {
      throw new BadRequest("maxLimitOfficersPerUserReached");
    }

    const { defaultDepartmentId, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      null,
    );

    const officer = await prisma.officer.create({
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        userId: user.id,
        departmentId: defaultDepartmentId ? defaultDepartmentId : data.department,
        badgeNumber: data.badgeNumber,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        whitelistStatusId,
      },
      include: leoProperties,
    });

    const updated = await linkDivisionsToOfficer(officer, data.divisions as string[]);
    return updated;
  }

  @Put("/:id")
  async updateOfficer(
    @PathParams("id") officerId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: any,
  ) {
    const data = validateSchema(CREATE_OFFICER_SCHEMA, body);

    const officer = await prisma.officer.findFirst({
      where: {
        id: officerId,
        userId: user.id,
      },
      include: leoProperties,
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    await validateMaxDivisionsPerOfficer(data.divisions as string[], cad);

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    await unlinkDivisionsFromOfficer(officer);

    const { defaultDepartmentId, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      officer,
    );

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        badgeNumber: data.badgeNumber,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        departmentId: defaultDepartmentId ? defaultDepartmentId : data.department,
        whitelistStatusId,
      },
      include: leoProperties,
    });

    const updated = await linkDivisionsToOfficer(updatedOfficer, data.divisions as string[]);
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
          include: leoProperties,
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
        include: leoProperties,
      }),
      await prisma.combinedLeoUnit.findMany({
        include: {
          status: { include: { value: true } },
          officers: { include: leoProperties },
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
      throw new ExtendedBadRequest({ image: "invalidImageType" });
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
  async panicButton(@Context("user") user: User, @BodyParams("officerId") officerId: string) {
    let officer = await prisma.officer.findFirst({
      where: {
        id: officerId,
        // @ts-expect-error `API_TOKEN` is a rank that gets appended in `IsAuth`
        userId: user.rank === "API_TOKEN" ? undefined : user.id,
      },
      include: leoProperties,
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    const code = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.PANIC_BUTTON,
      },
    });

    let type: "ON" | "OFF" = "ON";
    if (code) {
      /**
       * officer is already in panic-mode -> set status back to `ON_DUTY`
       */
      if (officer?.statusId === code?.id) {
        const onDutyCode = await prisma.statusValue.findFirst({
          where: {
            shouldDo: ShouldDoType.SET_ON_DUTY,
          },
        });

        if (!onDutyCode) {
          throw new BadRequest("mustHaveOnDutyCode");
        }

        type = "OFF";
        officer = await prisma.officer.update({
          where: {
            id: officer.id,
          },
          data: {
            statusId: onDutyCode?.id,
          },
          include: leoProperties,
        });
      } else {
        /**
         * officer is not yet in panic-mode -> set status to panic button status
         */
        officer = await prisma.officer.update({
          where: {
            id: officer.id,
          },
          data: {
            statusId: code.id,
          },
          include: leoProperties,
        });
      }
    }

    this.socket.emitUpdateOfficerStatus();
    this.socket.emitPanicButtonLeo(officer, type);
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
    @BodyParams() body: unknown,
    @PathParams("citizenId") citizenId: string,
  ) {
    const data = validateSchema(LICENSE_SCHEMA, body);

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
        ccwId: data.ccw || undefined,
        driversLicenseId: data.driversLicense || undefined,
        pilotLicenseId: data.pilotLicense || undefined,
        weaponLicenseId: data.weaponLicense || undefined,
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

export async function linkDivisionsToOfficer(
  officer: Officer & { divisions: DivisionValue[] },
  divisions: string[],
) {
  await Promise.all(
    divisions.map(async (id) => {
      return prisma.officer.update({
        where: { id: officer.id },
        data: {
          divisions: { connect: { id } },
        },
        include: leoProperties,
      });
    }),
  );

  const updated = await prisma.officer.findUnique({
    where: { id: officer.id },
    include: leoProperties,
  });

  return updated!;
}

export async function unlinkDivisionsFromOfficer(
  officer: Officer & { divisions: DivisionValue[] },
) {
  await Promise.all(
    officer.divisions.map(async ({ id }) => {
      return prisma.officer.update({
        where: { id: officer.id },
        data: {
          divisions: { disconnect: { id } },
        },
      });
    }),
  );
}

export async function validateMaxDivisionsPerOfficer(
  arr: any[],
  cad: { miscCadSettings: MiscCadSettings } | null,
) {
  const { maxDivisionsPerOfficer } = cad?.miscCadSettings ?? {};

  if (maxDivisionsPerOfficer && arr.length > maxDivisionsPerOfficer) {
    throw new ExtendedBadRequest({ divisions: "maxDivisionsReached" });
  }
}
