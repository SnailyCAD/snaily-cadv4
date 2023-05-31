import {
  Controller,
  UseBeforeEach,
  Use,
  MultipartFile,
  PlatformMulterFile,
  UseAfter,
} from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { DOCTOR_VISIT_SCHEMA, MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import {
  type cad as DBCad,
  type MiscCadSettings,
  ShouldDoType,
  type User,
  Feature,
} from "@prisma/client";
import type { EmsFdDeputy } from "@snailycad/types";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { IsAuth } from "middlewares/auth/is-auth";
import { ActiveDeputy } from "middlewares/active-deputy";
import fs from "node:fs/promises";
import { combinedEmsFdUnitProperties, unitProperties } from "lib/leo/activeOfficer";
import { validateSchema } from "lib/data/validate-schema";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { getInactivityFilter } from "lib/leo/utils";
import { Socket } from "services/socket-service";
import type * as APITypes from "@snailycad/types/api";
import { isFeatureEnabled } from "lib/upsert-cad";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { handlePanicButtonPressed } from "lib/leo/send-panic-button-webhook";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { hasPermission } from "@snailycad/permissions";
import { getImageWebPPath } from "lib/images/get-image-webp-path";
import { HandleInactivity } from "middlewares/handle-inactivity";
import { upsertEmsFdDeputy } from "lib/ems-fd/upsert-ems-fd-deputy";
import { citizenInclude } from "controllers/citizen/CitizenController";

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
    permissions: [Permissions.EmsFd, Permissions.ViewUnits, Permissions.ManageUnits],
  })
  async getDeputyLogs(
    @Context("user") user: User,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("emsFdDeputyId", String) emsFdDeputyId?: string,
  ): Promise<APITypes.GetMyDeputiesLogsData> {
    const hasManageUnitsPermissions = hasPermission({
      permissionsToCheck: [Permissions.ManageUnits, Permissions.ViewUnits, Permissions.DeleteUnits],
      userToCheck: user,
    });
    const userIdObj = hasManageUnitsPermissions ? {} : { userId: user.id };

    const where = { ...userIdObj, officerId: null, emsFdDeputyId: emsFdDeputyId || undefined };

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
    permissions: [Permissions.EmsFd],
  })
  async createEmsFdDeputy(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad")
    cad: DBCad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PostMyDeputiesData> {
    const deputy = await upsertEmsFdDeputy({
      body,
      user,
      cad,
      existingDeputy: null,
    });

    return deputy;
  }

  @Put("/:id")
  @UsePermissions({
    permissions: [Permissions.EmsFd],
  })
  async updateDeputy(
    @PathParams("id") deputyId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad")
    cad: DBCad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutMyDeputyByIdData> {
    const existingDeputy = await prisma.emsFdDeputy.findFirst({
      where: { id: deputyId, userId: user.id },
    });

    const updatedDeputy = await upsertEmsFdDeputy({
      body,
      user,
      cad,
      existingDeputy,
    });

    return updatedDeputy;
  }

  @Delete("/:id")
  @UsePermissions({
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
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  @UseAfter(HandleInactivity)
  async getActiveDeputies(
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @Context("user") user: User,
  ): Promise<APITypes.GetEmsFdActiveDeputies> {
    const unitsInactivityFilter = getInactivityFilter(
      cad,
      "unitInactivityTimeout",
      "lastStatusChangeTimestamp",
    );

    const activeDispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
      select: { departmentId: true },
    });

    const [deputies, combinedEmsFdDeputies] = await prisma.$transaction([
      prisma.emsFdDeputy.findMany({
        where: {
          status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          departmentId: activeDispatcher?.departmentId || undefined,
          ...(unitsInactivityFilter?.filter ?? {}),
        },
        include: unitProperties,
      }),
      prisma.combinedEmsFdUnit.findMany({
        include: combinedEmsFdUnitProperties,
        where: {
          ...unitsInactivityFilter?.filter,
          departmentId: activeDispatcher?.departmentId || undefined,
        },
      }),
    ]);

    return [...combinedEmsFdDeputies, ...deputies];
  }

  @Use(ActiveDeputy)
  @Post("/medical-record")
  @UsePermissions({
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

  @Put("/medical-records/:id")
  @Description("Update a medical record by its id")
  async updateMedicalRecord(
    @PathParams("id") recordId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCitizenMedicalRecordsData> {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const record = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    if (!record) {
      throw new NotFound("medicalRecordNotFound");
    }

    const updated = await prisma.medicalRecord.update({
      where: {
        id: record.id,
      },
      data: {
        description: data.description,
        type: data.type,
        bloodGroupId: data.bloodGroup || null,
      },
      include: {
        bloodGroup: true,
      },
    });

    await prisma.medicalRecord.updateMany({
      where: { citizenId: record.citizenId },
      data: { bloodGroupId: data.bloodGroup || undefined },
    });

    return updated;
  }

  @Use(ActiveDeputy)
  @Delete("/medical-records/:id")
  @Description("Delete a medical record by its id")
  async deleteMedicalRecord(
    @PathParams("id") recordId: string,
  ): Promise<APITypes.DeleteCitizenMedicalRecordsData> {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    if (!medicalRecord) {
      throw new NotFound("medicalRecordNotFound");
    }

    await prisma.medicalRecord.delete({
      where: {
        id: medicalRecord.id,
      },
    });

    return true;
  }

  @Use(ActiveDeputy)
  @Post("/doctor-visit")
  @UsePermissions({
    permissions: [Permissions.EmsFd],
  })
  async createDoctorVisit(@BodyParams() body: unknown): Promise<APITypes.PostEmsFdDoctorVisit> {
    const data = validateSchema(DOCTOR_VISIT_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const doctorVisit = await prisma.doctorVisit.create({
      data: {
        citizenId: citizen.id,
        userId: citizen.userId,
        conditions: data.conditions,
        diagnosis: data.diagnosis,
        medications: data.medications,
        description: data.description,
      },
      include: {
        citizen: true,
      },
    });

    return doctorVisit;
  }

  @Post("/declare/:citizenId")
  @UsePermissions({
    permissions: [Permissions.DeclareCitizenDead, Permissions.ManageDeadCitizens],
  })
  async declareCitizenDeadOrAlive(
    @PathParams("citizenId") citizenId: string,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
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
  @IsFeatureEnabled({ feature: Feature.PANIC_BUTTON })
  @Description("Set the panic button for an ems-fd deputy by their id")
  @UsePermissions({
    permissions: [Permissions.EmsFd],
  })
  async panicButton(
    @Context("user") user: User,
    @Context("cad") cad: DBCad & { miscCadSettings: MiscCadSettings },
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
    handlePanicButtonPressed({
      locale: user.locale,
      force: panicType === "ON",
      cad,
      socket: this.socket,
      status: deputy.status,
      unit: deputy,
    });

    return deputy;
  }

  @Get("/dead-citizens")
  @Description("Get all the marked dead citizens")
  @UsePermissions({
    permissions: [Permissions.ViewDeadCitizens, Permissions.ManageDeadCitizens],
  })
  async getDeadCitizens(): Promise<APITypes.GetDeadCitizensData> {
    const [totalCount, citizens] = await prisma.$transaction([
      prisma.citizen.count({ where: { dead: true } }),
      prisma.citizen.findMany({
        where: {
          dead: true,
        },
        include: citizenInclude,
      }),
    ]);

    return { totalCount, citizens };
  }

  @Post("/image/:id")
  @UsePermissions({
    permissions: [Permissions.EmsFd],
  })
  async uploadImageToOfficer(
    @Context("user") user: User,
    @PathParams("id") deputyId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostMyDeputyByIdData> {
    try {
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
        id: `${deputy.id}-${file.originalname.split(".")[0]}`,
      });

      const previousImage = deputy.imageId
        ? `${process.cwd()}/public/units/${deputy.imageId}`
        : undefined;

      if (previousImage) {
        await fs.rm(previousImage, { force: true });
      }

      const [data] = await Promise.all([
        prisma.emsFdDeputy.update({
          where: { id: deputy.id },
          data: {
            imageId: image.fileName,
            imageBlurData: await generateBlurPlaceholder(image),
          },
          select: { imageId: true },
        }),
        fs.writeFile(image.path, image.buffer),
      ]);

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
  }
}
