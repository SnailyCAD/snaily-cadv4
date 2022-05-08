import process from "node:process";
import {
  Controller,
  UseBeforeEach,
  PlatformMulterFile,
  MultipartFile,
  UseBefore,
} from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { IsAuth } from "middlewares/IsAuth";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Socket } from "services/SocketService";
import fs from "node:fs";
import { combinedUnitProperties, leoProperties } from "lib/leo/activeOfficer";
import { validateImgurURL } from "utils/image";
import { Officer, ShouldDoType, User, MiscCadSettings, Feature, CadFeature } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import type { CombinedLeoUnit } from "@snailycad/types";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { getInactivityFilter, validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { isFeatureEnabled } from "lib/cad";
import { findUnit } from "lib/leo/findUnit";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";

@Controller("/leo")
@UseBeforeEach(IsAuth)
export class LeoController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async getUserOfficers(@Context("user") user: User) {
    const officers = await prisma.officer.findMany({
      where: { userId: user.id },
      include: {
        ...leoProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return { officers };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createOfficer(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: { features: CadFeature[]; miscCadSettings: MiscCadSettings },
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
    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "officer",
    });

    const officerCount = await prisma.officer.count({
      where: { userId: user.id },
    });

    if (
      cad.miscCadSettings.maxOfficersPerUser &&
      officerCount >= cad.miscCadSettings.maxOfficersPerUser
    ) {
      throw new BadRequest("maxLimitOfficersPerUserReached");
    }

    const isBadgeNumbersEnabled = isFeatureEnabled({
      feature: Feature.BADGE_NUMBERS,
      defaultReturn: true,
      features: cad.features,
    });

    const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      null,
    );

    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      type: "leo",
    });

    const incremental = await findNextAvailableIncremental({ type: "leo" });
    const officer = await prisma.officer.create({
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        userId: user.id,
        departmentId: defaultDepartment ? defaultDepartment.id : data.department,
        rankId:
          (defaultDepartment
            ? defaultDepartment.defaultOfficerRankId
            : department.defaultOfficerRankId) || undefined,
        badgeNumber: isBadgeNumbersEnabled ? data.badgeNumber : undefined,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        whitelistStatusId,
        incremental,
      },
      include: leoProperties,
    });

    const disconnectConnectArr = manyToManyHelper([], data.divisions as string[]);

    const updated = getLastOfArray(
      await prisma.$transaction(
        disconnectConnectArr.map((v, idx) =>
          prisma.officer.update({
            where: { id: officer.id },
            data: { divisions: v },
            include:
              idx + 1 === disconnectConnectArr.length
                ? {
                    ...leoProperties,
                    qualifications: { include: { qualification: { include: { value: true } } } },
                  }
                : undefined,
          }),
        ),
      ),
    );

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateOfficer(
    @PathParams("id") officerId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: { features: CadFeature[]; miscCadSettings: MiscCadSettings },
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
    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      type: "leo",
      unitId: officer.id,
    });
    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "officer",
      unitId: officer.id,
    });

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      officer,
    );

    const disconnectConnectArr = manyToManyHelper(
      officer.divisions.map((v) => v.id),
      data.divisions as string[],
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.officer.update({ where: { id: officer.id }, data: { divisions: v } }),
      ),
    );

    const isBadgeNumbersEnabled = isFeatureEnabled({
      feature: Feature.BADGE_NUMBERS,
      defaultReturn: true,
      features: cad.features,
    });

    const rank = officer.rankId
      ? undefined
      : (defaultDepartment
          ? defaultDepartment.defaultOfficerRankId
          : department.defaultOfficerRankId) || undefined;

    const incremental = officer.incremental
      ? undefined
      : await findNextAvailableIncremental({ type: "leo" });

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        badgeNumber: isBadgeNumbersEnabled ? data.badgeNumber : undefined,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        departmentId: defaultDepartment ? defaultDepartment.id : data.department,
        rankId: rank,
        whitelistStatusId,
        incremental,
      },
      include: {
        ...leoProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return updatedOfficer;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
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
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
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
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch || u.isEmsFd,
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getActiveOfficer(@Context() ctx: Context) {
    return ctx.get("activeOfficer");
  }

  @Get("/active-officers")
  @Description("Get all the active officers")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch || u.isEmsFd,
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getActiveOfficers(@Context("cad") cad: { miscCadSettings: MiscCadSettings }) {
    const unitsInactivityFilter = getInactivityFilter(cad, "lastStatusChangeTimestamp");

    if (unitsInactivityFilter) {
      setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp);
    }

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
        include: combinedUnitProperties,
      }),
    ]);

    const officersWithUpdatedStatus = officers.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );
    const combinedUnitsWithUpdatedStatus = units.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );

    return [...officersWithUpdatedStatus, ...combinedUnitsWithUpdatedStatus];
  }

  @Post("/image/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
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
  @Description("Set the panic button for an officer by their id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async panicButton(@Context("user") user: User, @BodyParams("officerId") officerId: string) {
    let type: "officer" | "combinedLeoUnit" = "officer";

    let officer: CombinedLeoUnit | Officer | null = await prisma.officer.findFirst({
      where: {
        id: officerId,
        // @ts-expect-error `API_TOKEN` is a rank that gets appended in `IsAuth`
        userId: user.rank === "API_TOKEN" ? undefined : user.id,
      },
      include: leoProperties,
    });

    if (!officer) {
      officer = (await prisma.combinedLeoUnit.findFirst({
        where: { id: officerId },
        include: combinedUnitProperties,
      })) as CombinedLeoUnit | null;
      if (officer) {
        type = "combinedLeoUnit";
      }
    }

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    const code = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.PANIC_BUTTON,
      },
    });

    let panicType: "ON" | "OFF" = "ON";
    if (code) {
      /**
       * officer is already in panic-mode -> set status back to `ON_DUTY`
       */
      if (officer.statusId === code?.id) {
        const onDutyCode = await prisma.statusValue.findFirst({
          where: {
            shouldDo: ShouldDoType.SET_ON_DUTY,
          },
        });

        if (!onDutyCode) {
          throw new BadRequest("mustHaveOnDutyCode");
        }

        panicType = "OFF";
        // @ts-expect-error the properties used are the same.
        officer = await prisma[type].update({
          where: {
            id: officer.id,
          },
          data: {
            statusId: onDutyCode?.id,
          },
          include: type === "officer" ? leoProperties : combinedUnitProperties,
        });
      } else {
        /**
         * officer is not yet in panic-mode -> set status to panic button status
         */
        // @ts-expect-error the properties used are the same.
        officer = await prisma[type].update({
          where: {
            id: officer.id,
          },
          data: {
            statusId: code.id,
          },
          include: type === "officer" ? leoProperties : combinedUnitProperties,
        });
      }
    }

    await this.socket.emitUpdateOfficerStatus();
    this.socket.emitPanicButtonLeo(officer, panicType);
  }

  @Get("/impounded-vehicles")
  @Description("Get all the impounded vehicles")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ViewImpoundLot, Permissions.ManageImpoundLot],
  })
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

  @Delete("/impounded-vehicles/:id")
  @Description("Remove a vehicle from the impound lot")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageImpoundLot],
  })
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

  @Get("/qualifications/:unitId")
  @Description("Get a unit's awards and qualifications")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch || u.isEmsFd,
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getUnitQualifications(@PathParams("unitId") unitId: string) {
    const { type, unit } = await findUnit(unitId);

    if (type === "combined") {
      throw new BadRequest("combinedNotSupported");
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const types = {
      leo: "officerId",
      "ems-fd": "emsFdDeputyId",
    };

    const data = await prisma.unitQualification.findMany({
      where: { [types[type]]: unit.id },
      include: { qualification: { include: { value: true } } },
    });

    return data;
  }
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
