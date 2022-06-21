import { Controller, UseBeforeEach, UseBefore } from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { SWITCH_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Socket } from "services/SocketService";
import { combinedUnitProperties, leoProperties } from "lib/leo/activeOfficer";
import { CombinedLeoUnit, Officer, ShouldDoType, User, MiscCadSettings } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { getInactivityFilter } from "lib/leo/utils";
import { findUnit } from "lib/leo/findUnit";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
@Controller("/leo")
@UseBeforeEach(IsAuth)
export class LeoController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @UseBefore(ActiveOfficer)
  @Get("/active-officer")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch || u.isEmsFd,
    permissions: [Permissions.Leo, Permissions.Dispatch, Permissions.EmsFd],
  })
  async getActiveOfficer(
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ) {
    return activeOfficer;
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
            NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY },
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

  @Put("/callsign/:officerId")
  @Description("Update the officer's activeDivisionCallsign")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.rank !== "USER",
    permissions: [Permissions.Leo, Permissions.ManageUnitCallsigns],
  })
  async updateOfficerDivisionCallsign(
    @BodyParams() body: unknown,
    @PathParams("officerId") officerId: string,
  ) {
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
}
