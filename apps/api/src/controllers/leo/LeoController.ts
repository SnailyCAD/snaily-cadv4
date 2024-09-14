import { QueryParams, Controller, UseBeforeEach, UseBefore, UseAfter } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { LEO_PANIC_BUTTON_SCHEMA, SWITCH_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { ActiveOfficer } from "middlewares/active-officer";
import { Socket } from "services/socket-service";
import { combinedUnitProperties, leoProperties } from "utils/leo/includes";
import { type cad, type Prisma, ShouldDoType, type User, WhatPages } from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { getInactivityFilter } from "lib/leo/utils";
import { findUnit } from "lib/leo/findUnit";
import {
  type CombinedLeoUnit,
  type Officer,
  type MiscCadSettings,
  Feature,
} from "@snailycad/types";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { handlePanicButtonPressed } from "lib/leo/send-panic-button-webhook";
import { HandleInactivity } from "middlewares/handle-inactivity";
import { userProperties } from "~/lib/auth/getSessionUser";
import { recordsLogsInclude } from "../admin/manage/citizens/records-logs-controller";

@Controller("/leo")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class LeoController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @UseBefore(ActiveOfficer)
  @Get("/active-officer")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getActiveOfficer(
    @Context("activeOfficer") activeOfficer: CombinedLeoUnit | Officer,
  ): Promise<APITypes.GetActiveOfficerData> {
    return activeOfficer;
  }

  @Get("/active-officers")
  @Description("Get all the active officers")
  @UseAfter(HandleInactivity)
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getActiveOfficers(
    @Context("user") user: User,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query?: string,
  ): Promise<APITypes.GetActiveOfficersData> {
    const unitsInactivityFilter = getInactivityFilter(cad, "unitInactivityTimeout");

    const activeDispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
      select: { departmentId: true },
    });

    const officerWhere = query ? activeOfficersWhereInput(query) : undefined;
    const [officers, combinedUnits] = await prisma.$transaction([
      prisma.officer.findMany({
        take: includeAll ? undefined : 12,
        skip: includeAll ? undefined : skip,
        orderBy: { updatedAt: "desc" },
        where: {
          departmentId: activeDispatcher?.departmentId || undefined,
          status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          ...(unitsInactivityFilter?.filter ?? {}),
          ...officerWhere,
        },
        include: leoProperties,
      }),
      prisma.combinedLeoUnit.findMany({
        include: combinedUnitProperties,
        orderBy: { updatedAt: "desc" },
        where: {
          status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          ...(unitsInactivityFilter?.filter ?? {}),

          departmentId: activeDispatcher?.departmentId || undefined,
        },
      }),
    ]);

    return [...combinedUnits, ...officers];
  }

  @Post("/panic-button")
  @Description("Set the panic button for an officer by their id")
  @IsFeatureEnabled({ feature: Feature.PANIC_BUTTON })
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async panicButton(
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostLeoTogglePanicButtonData> {
    const data = validateSchema(LEO_PANIC_BUTTON_SCHEMA, body);
    let type: "officer" | "combinedLeoUnit" = "officer";
    let panicType: "ON" | "OFF" = "ON";

    let officer: CombinedLeoUnit | Officer | null = await prisma.officer.findFirst({
      where: {
        id: data.officerId,
        // @ts-expect-error `API_TOKEN` is a rank that gets appended in `IsAuth`
        userId: user.rank === "API_TOKEN" ? undefined : user.id,
      },
      include: leoProperties,
    });

    if (!officer) {
      officer = (await prisma.combinedLeoUnit.findFirst({
        where: { id: data.officerId },
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

    if (!code) {
      throw new BadRequest("panicButtonCodeNotFound");
    }

    if (data.isEnabled) {
      // Panic button is already enabled, simply return the officer
      if (code?.id === officer.statusId) {
        return officer;
      }

      // @ts-expect-error the properties used are the same.
      officer = await prisma[type].update({
        where: { id: officer.id },
        data: { statusId: code.id },
        include: type === "officer" ? leoProperties : combinedUnitProperties,
      });
    } else {
      /**
       * officer is already in panic-mode -> set status back to `ON_DUTY`
       */
      if (officer?.statusId === code?.id) {
        const onDutyCode = await prisma.statusValue.findFirst({
          where: {
            shouldDo: ShouldDoType.SET_ON_DUTY,
            OR: [{ whatPages: { isEmpty: true } }, { whatPages: { has: WhatPages.LEO } }],
          },
        });

        if (!onDutyCode) {
          throw new BadRequest("mustHaveOnDutyCode");
        }

        panicType = "OFF";
        // @ts-expect-error the properties used are the same.
        officer = await prisma[type].update({
          where: {
            id: officer?.id,
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
          where: { id: officer?.id },
          data: { statusId: code.id },
          include: type === "officer" ? leoProperties : combinedUnitProperties,
        });
      }
    }

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    await this.socket.emitUpdateOfficerStatus();
    handlePanicButtonPressed({
      locale: user.locale,
      force: panicType === "ON",
      cad,
      socket: this.socket,
      status: officer.status,
      unit: officer,
    });

    return officer;
  }

  @Get("/impounded-vehicles")
  @Description("Get all the impounded vehicles")
  @UsePermissions({
    permissions: [Permissions.ViewImpoundLot, Permissions.ManageImpoundLot],
  })
  async getImpoundedVehicles(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("search", String) search?: string,
  ): Promise<APITypes.GetLeoImpoundedVehiclesData> {
    const where: Prisma.ImpoundedVehicleWhereInput = {
      vehicle: {
        plate: { contains: search, mode: "insensitive" },
        model: { value: { value: { contains: search, mode: "insensitive" } } },
      },
    };

    const [totalCount, vehicles] = await prisma.$transaction([
      prisma.impoundedVehicle.count({ where }),
      prisma.impoundedVehicle.findMany({
        where,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: {
          location: true,
          officer: { include: leoProperties },
          vehicle: {
            include: { citizen: true, model: { include: { value: true } } },
          },
        },
      }),
    ]);

    return { totalCount, vehicles };
  }

  @Delete("/impounded-vehicles/:id")
  @Description("Remove a vehicle from the impound lot")
  @UsePermissions({
    permissions: [Permissions.ManageImpoundLot],
  })
  async checkoutImpoundedVehicle(
    @PathParams("id") id: string,
  ): Promise<APITypes.DeleteLeoCheckoutImpoundedVehicleData> {
    const vehicle = await prisma.impoundedVehicle.findFirst({
      where: { OR: [{ id }, { registeredVehicleId: id }] },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    await prisma.impoundedVehicle.deleteMany({
      where: { OR: [{ id }, { registeredVehicleId: id }] },
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
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getUnitQualifications(
    @PathParams("unitId") unitId: string,
  ): Promise<APITypes.GetUnitQualificationsByUnitIdData> {
    const { type, unit } = await findUnit(unitId);

    if (type === "combined-leo" || type === "combined-ems-fd") {
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

  @Put("/callsign/:officerId")
  @Description("Update the officer's activeDivisionCallsign")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.ManageUnitCallsigns, Permissions.ManageUnitRank],
  })
  async updateOfficerDivisionCallsign(
    @BodyParams() body: unknown,
    @PathParams("officerId") officerId: string,
  ): Promise<APITypes.PutLeoCallsignData> {
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    const data = validateSchema(SWITCH_CALLSIGN_SCHEMA, body);

    let callsignId = null;
    /**
     * yes, !== "null" can be here, in the UI its handled that way. A bit weird I know, but it does the job!
     */
    if (data.callsign && data.callsign !== "null") {
      const callsign = await prisma.individualDivisionCallsign.findFirst({
        where: { id: data.callsign, officerId: officer.id },
      });

      if (!callsign) {
        throw new NotFound("callsignNotFound");
      }

      callsignId = callsign.id;
    }

    const updated = await prisma.officer.update({
      where: { id: officer.id },
      data: { activeDivisionCallsignId: callsignId },
      include: leoProperties,
    });

    await this.socket.emitUpdateOfficerStatus();

    return updated;
  }

  @Get("/my-record-reports")
  async getMyRecordReports(
    @Context("sessionUserId") sessionUserId: string,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetMyRecordReports> {
    const where = {
      OR: [
        { records: { officer: { userId: sessionUserId } } },
        { warrant: { officer: { userId: sessionUserId } } },
      ],
    } satisfies Prisma.RecordLogWhereInput;

    const [totalCount, reports] = await prisma.$transaction([
      prisma.recordLog.count({
        where,
      }),
      prisma.recordLog.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          warrant: { include: { officer: { include: leoProperties } } },
          records: { include: recordsLogsInclude },
          citizen: {
            include: { user: { select: userProperties }, gender: true, ethnicity: true },
          },
        },
      }),
    ]);

    return { reports, totalCount };
  }
}

function activeOfficersWhereInput(query: string) {
  const [name, surname] = query.toString().toLowerCase().split(/ +/g);

  return {
    OR: [
      { callsign: { contains: query, mode: "insensitive" } },
      { callsign2: { contains: query, mode: "insensitive" } },
      { divisions: { some: { value: { value: { contains: query, mode: "insensitive" } } } } },
      { department: { value: { value: { contains: query, mode: "insensitive" } } } },
      { badgeNumberString: { contains: query, mode: "insensitive" } },
      { rank: { value: { contains: query, mode: "insensitive" } } },
      { activeVehicle: { value: { value: { contains: query, mode: "insensitive" } } } },
      { radioChannelId: { contains: query, mode: "insensitive" } },
      {
        status: {
          AND: [
            { value: { value: { contains: query, mode: "insensitive" } } },
            { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          ],
        },
      },
      {
        citizen: {
          OR: [
            {
              name: { contains: name, mode: "insensitive" },
              surname: { contains: surname, mode: "insensitive" },
            },
            {
              name: { contains: surname, mode: "insensitive" },
              surname: { contains: name, mode: "insensitive" },
            },
          ],
        },
      },
    ],
  } satisfies Prisma.OfficerWhereInput;
}
