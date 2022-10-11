import { Controller, UseBeforeEach, Use, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { EMS_FD_DEPUTY_SCHEMA, MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { type MiscCadSettings, ShouldDoType, type User, CadFeature, Feature } from "@prisma/client";
import type { cad, EmsFdDeputy } from "@snailycad/types";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { IsAuth } from "middlewares/IsAuth";
import { ActiveDeputy } from "middlewares/ActiveDeputy";
import fs from "node:fs/promises";
import { unitProperties } from "lib/leo/activeOfficer";
import { getImageWebPPath, validateImgurURL } from "utils/image";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { getInactivityFilter, validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { Socket } from "services/SocketService";
import type * as APITypes from "@snailycad/types/api";
import { isFeatureEnabled } from "lib/cad";

@Controller("/ems-fd")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class EmsFdController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async getUserDeputies(@Context("user") user: User): Promise<APITypes.GetMyDeputiesData> {
    const deputies = await prisma.emsFdDeputy.findMany({
      where: { userId: user.id },
      include: {
        ...unitProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return { deputies };
  }

  @Get("/logs")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd, Permissions.ViewUnits, Permissions.ManageUnits],
  })
  async getDeputyLogs(
    @Context("user") user: User,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("emsFdDeputyId", String) emsFdDeputyId?: string,
  ): Promise<APITypes.GetMyDeputiesLogsData> {
    const where = { userId: user.id, officerId: null, emsFdDeputyId: emsFdDeputyId || undefined };

    const [totalCount, logs] = await prisma.$transaction([
      prisma.officerLog.count({ where }),
      prisma.officerLog.findMany({
        take: includeAll ? undefined : 25,
        skip: includeAll ? undefined : skip,
        where,
        include: { emsFdDeputy: { include: unitProperties } },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    return { totalCount, logs };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async createEmsFdDeputy(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PostMyDeputiesData> {
    const data = validateSchema(EMS_FD_DEPUTY_SCHEMA, body);

    const divisionsEnabled = isFeatureEnabled({
      feature: Feature.DIVISIONS,
      defaultReturn: true,
      features: cad.features,
    });

    if (divisionsEnabled) {
      const division = await prisma.divisionValue.findFirst({
        where: {
          id: data.division,
          departmentId: data.department,
        },
      });

      if (!division) {
        throw new ExtendedBadRequest({ division: "divisionNotInDepartment" });
      }
    }

    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "emsFdDeputy",
    });
    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      type: "ems-fd",
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      null,
    );

    const incremental = await findNextAvailableIncremental({ type: "ems-fd" });
    const deputy = await prisma.emsFdDeputy.create({
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        userId: user.id,
        departmentId: defaultDepartment ? defaultDepartment.id : data.department,
        rankId:
          (defaultDepartment
            ? defaultDepartment.defaultOfficerRankId
            : department.defaultOfficerRankId) || undefined,
        divisionId: data.division || null,
        badgeNumber: data.badgeNumber,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        incremental,
        whitelistStatusId,
      },
      include: {
        ...unitProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return deputy;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async updateDeputy(
    @PathParams("id") deputyId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutMyDeputyByIdData> {
    const data = validateSchema(EMS_FD_DEPUTY_SCHEMA, body);

    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        id: deputyId,
        userId: user.id,
      },
      include: { whitelistStatus: true },
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
    }

    const divisionsEnabled = isFeatureEnabled({
      feature: Feature.DIVISIONS,
      defaultReturn: true,
      features: cad.features,
    });

    if (divisionsEnabled) {
      const division = await prisma.divisionValue.findFirst({
        where: {
          id: data.division,
          departmentId: data.department,
        },
      });

      if (!division) {
        throw new ExtendedBadRequest({ division: "divisionNotInDepartment" });
      }
    }

    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "emsFdDeputy",
      unitId: deputy.id,
    });
    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      type: "ems-fd",
      unitId: deputy.id,
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const incremental = deputy.incremental
      ? undefined
      : await findNextAvailableIncremental({ type: "ems-fd" });

    const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      deputy,
    );

    const rank = deputy.rankId
      ? undefined
      : (defaultDepartment
          ? defaultDepartment.defaultOfficerRankId
          : department.defaultOfficerRankId) || undefined;

    const updated = await prisma.emsFdDeputy.update({
      where: {
        id: deputy.id,
      },
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        departmentId: defaultDepartment ? defaultDepartment.id : data.department,
        divisionId: data.division!,
        badgeNumber: data.badgeNumber,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        incremental,
        whitelistStatusId,
        rankId: rank,
      },
      include: {
        ...unitProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async deleteDeputy(
    @PathParams("id") id: string,
    @Context("user") user: User,
  ): Promise<APITypes.DeleteMyDeputyByIdData> {
    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: user.id,
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
  @UsePermissions({
    fallback: (u) => u.isEmsFd || u.isLeo || u.isDispatch,
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  async getActiveDeputy(
    @Context("activeDeputy") activeDeputy: EmsFdDeputy,
  ): Promise<APITypes.GetEmsFdActiveDeputy> {
    return activeDeputy;
  }

  @Get("/active-deputies")
  @Description("Get all the active EMS/FD deputies")
  @UsePermissions({
    fallback: (u) => u.isEmsFd || u.isLeo || u.isDispatch,
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  async getActiveDeputies(
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.GetEmsFdActiveDeputies> {
    const unitsInactivityFilter = getInactivityFilter(
      cad,
      "unitInactivityTimeout",
      "lastStatusChangeTimestamp",
    );

    if (unitsInactivityFilter) {
      setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp);
    }

    const deputies = await prisma.emsFdDeputy.findMany({
      where: {
        status: {
          NOT: {
            shouldDo: ShouldDoType.SET_OFF_DUTY,
          },
        },
      },
      include: unitProperties,
    });

    const deputiesWithUpdatedStatus = deputies.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );

    return deputiesWithUpdatedStatus;
  }
  @Use(ActiveDeputy)
  @Post("/medical-record")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async createMedicalRecord(@BodyParams() body: unknown): Promise<APITypes.PostEmsFdMedicalRecord> {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: citizen.userId,
        type: data.type,
        description: data.description,
        bloodGroupId: data.bloodGroup ?? null,
      },
      include: { bloodGroup: true },
    });

    return medicalRecord;
  }

  @Post("/declare/:citizenId")
  @UsePermissions({
    fallback: (u) => u.isEmsFd || u.isLeo || u.isDispatch,
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  async declareCitizenDeadOrAlive(
    @PathParams("citizenId") citizenId: string,
    @Context("cad") cad: cad,
  ): Promise<APITypes.PostEmsFdDeclareCitizenById> {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const deleteOnDeadFeature = isFeatureEnabled({
      defaultReturn: false,
      feature: Feature.CITIZEN_DELETE_ON_DEAD,
      features: cad.features,
    });

    if (deleteOnDeadFeature) {
      const deleted = await prisma.citizen.delete({
        where: { id: citizen.id },
      });

      return { ...deleted, dead: true, dateOfDead: new Date() };
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

  @Post("/panic-button")
  @Description("Set the panic button for an ems-fd deputy by their id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async panicButton(
    @Context("user") user: User,
    @BodyParams("deputyId") deputyId: string,
  ): Promise<APITypes.PostEmsFdTogglePanicButtonData> {
    let deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        id: deputyId,
        // @ts-expect-error `API_TOKEN` is a rank that gets appended in `IsAuth`
        userId: user.rank === "API_TOKEN" ? undefined : user.id,
      },
      include: unitProperties,
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
    }

    const code = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.PANIC_BUTTON,
      },
    });

    let panicType: "ON" | "OFF" = "ON";
    if (code) {
      /**
       * deputy is already in panic-mode -> set status back to `ON_DUTY`
       */
      if (deputy.statusId === code?.id) {
        const onDutyCode = await prisma.statusValue.findFirst({
          where: {
            shouldDo: ShouldDoType.SET_ON_DUTY,
          },
        });

        if (!onDutyCode) {
          throw new BadRequest("mustHaveOnDutyCode");
        }

        panicType = "OFF";
        deputy = await prisma.emsFdDeputy.update({
          where: { id: deputy.id },
          data: { statusId: onDutyCode?.id },
          include: unitProperties,
        });
      } else {
        /**
         * deputy is not yet in panic-mode -> set status to panic button status
         */
        deputy = await prisma.emsFdDeputy.update({
          where: { id: deputy.id },
          data: { statusId: code.id },
          include: unitProperties,
        });
      }
    }

    await this.socket.emitUpdateDeputyStatus();
    this.socket.emitPanicButtonLeo(deputy, panicType);

    return deputy;
  }

  @Post("/image/:id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async uploadImageToOfficer(
    @Context("user") user: User,
    @PathParams("id") deputyId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostMyDeputyByIdData> {
    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: user.id,
        id: deputyId,
      },
    });

    if (!deputy) {
      throw new NotFound("Not Found");
    }

    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    const image = await getImageWebPPath({
      buffer: file.buffer,
      pathType: "units",
      id: deputy.id,
    });

    const [data] = await Promise.all([
      prisma.emsFdDeputy.update({
        where: { id: deputy.id },
        data: { imageId: image.fileName },
        select: { imageId: true },
      }),
      fs.writeFile(image.path, image.buffer),
    ]);

    return data;
  }
}
