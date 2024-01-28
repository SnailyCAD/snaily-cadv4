import {
  type User,
  ShouldDoType,
  type MiscCadSettings,
  type cad,
  type Officer,
  type CombinedLeoUnit,
  type EmsFdDeputy,
  WhitelistStatus,
  DiscordWebhookType,
  Feature,
  type DivisionValue,
} from "@prisma/client";
import { UPDATE_OFFICER_STATUS_SCHEMA } from "@snailycad/schemas";
import { Req, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Description, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import { Socket } from "services/socket-service";
import { IsAuth } from "middlewares/auth/is-auth";
import { validateSchema } from "lib/data/validate-schema";
import { handleStartEndOfficerLog } from "lib/leo/handleStartEndOfficerLog";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { findUnit } from "lib/leo/findUnit";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import type * as APITypes from "@snailycad/types/api";
import { createWebhookData } from "lib/dispatch/webhooks";
import { createCallEventOnStatusChange } from "lib/dispatch/createCallEventOnStatusChange";
import { ExtendedNotFound } from "~/exceptions/extended-not-found";
import { isFeatureEnabled } from "lib/upsert-cad";
import { handlePanicButtonPressed } from "lib/leo/send-panic-button-webhook";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  combinedEmsFdUnitProperties,
} from "utils/leo/includes";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class StatusController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Put("/:unitId")
  @Description("Update the status of a unit by its id.")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async updateUnitStatus(
    @PathParams("unitId") unitId: string,
    @Context("user") user: User,
    @BodyParams() body: unknown,
    @Req() req: Req,
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutDispatchStatusByUnitId> {
    const data = validateSchema(UPDATE_OFFICER_STATUS_SCHEMA, body);
    const bodyStatusId = data.status;

    const isFromDispatch = req.headers["is-from-dispatch"]?.toString() === "true";
    const isAdmin = hasPermission({
      userToCheck: user,
      permissionsToCheck: defaultPermissions.allDefaultAdminPermissions,
    });
    const isDispatch =
      isAdmin ||
      (isFromDispatch &&
        hasPermission({
          userToCheck: user,
          permissionsToCheck: [Permissions.Dispatch],
        }));

    const isDivisionsEnabled = isFeatureEnabled({
      defaultReturn: true,
      feature: Feature.DIVISIONS,
      features: cad.features,
    });

    const unit = await findUnit(
      unitId,
      { userId: isDispatch ? undefined : user.id },
      { officer: { divisions: true } },
    );

    if (!unit.unit) {
      throw new NotFound("unitNotFound");
    }

    if ("suspended" in unit && unit.suspended) {
      throw new BadRequest("unitSuspended");
    }

    const code = await prisma.statusValue.findFirst({
      where: { id: bodyStatusId },
      include: { value: true },
    });

    let userDefinedCallsign: string | undefined;
    if (data.userDefinedCallsign && code?.shouldDo === ShouldDoType.SET_ON_DUTY) {
      const canSetUserDefinedCallsign = hasPermission({
        permissionsToCheck: [
          Permissions.SetUserDefinedCallsignOnEmsFd,
          Permissions.SetUserDefinedCallsignOnOfficer,
        ],
        userToCheck: user,
      });

      if (!canSetUserDefinedCallsign) {
        throw new BadRequest("cannotSetUserDefinedCallsign");
      }

      const [existingOfficer, existingDeputy] = await prisma.$transaction([
        prisma.officer.findFirst({
          where: { userDefinedCallsign: { equals: data.userDefinedCallsign, mode: "insensitive" } },
        }),
        prisma.emsFdDeputy.findFirst({
          where: { userDefinedCallsign: { equals: data.userDefinedCallsign, mode: "insensitive" } },
        }),
      ]);

      if (existingOfficer || existingDeputy) {
        throw new BadRequest("callsignAlreadyTaken");
      }

      userDefinedCallsign = data.userDefinedCallsign;
    }

    let activeEmergencyVehicleId: string | undefined | null;
    if (data.vehicleId && code?.shouldDo === ShouldDoType.SET_ON_DUTY) {
      const divisionIds = getDivisionsFromUnit(unit, isDivisionsEnabled);

      const _emergencyVehicle = await prisma.emergencyVehicleValue.findFirst({
        where: {
          id: data.vehicleId,
          OR: [
            ...divisionIds.map((id: string) => ({ divisions: { some: { id } } })),
            unit.unit.departmentId ? { departments: { some: { id: unit.unit.departmentId } } } : {},
          ],
        },
      });

      if (!_emergencyVehicle) {
        throw new ExtendedNotFound({ vehicleId: "vehicleNotPartOfYourDepartment" });
      }

      activeEmergencyVehicleId = _emergencyVehicle.id;
    } else if (code?.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      activeEmergencyVehicleId = null;
    }

    /**
     * officer's status cannot be changed when in a combined unit
     * -> the combined unit's status must be updated.
     */
    if (unit.type === "leo" && !isDispatch) {
      const hasCombinedUnit = await prisma.combinedLeoUnit.findFirst({
        where: {
          officers: { some: { id: unit.unit.id } },
        },
      });

      if (hasCombinedUnit) {
        throw new BadRequest("officerIsCombined");
      }
    }

    if (unit.type === "ems-fd" && !isDispatch) {
      const hasCombinedUnit = await prisma.combinedEmsFdUnit.findFirst({
        where: {
          deputies: { some: { id: unit.unit.id } },
        },
      });

      if (hasCombinedUnit) {
        throw new BadRequest("emsFdDeputyIsCombined");
      }
    }

    if (!code) {
      throw new NotFound("statusNotFound");
    }

    if (unit.type === "leo") {
      const officer = await prisma.officer.findUnique({
        where: { id: unit.unit.id },
        include: leoProperties,
      });

      const isOfficerDisabled = officer?.whitelistStatus
        ? officer.whitelistStatus.status !== WhitelistStatus.ACCEPTED &&
          !officer.department?.isDefaultDepartment
        : false;

      if (isOfficerDisabled) {
        throw new BadRequest("cannotUseThisOfficer");
      }

      await handlePanicButtonPressed({
        locale: user.locale,
        socket: this.socket,
        cad,
        status: code,
        unit: officer!,
      });
    }

    if (unit.type === "combined-leo" || unit.type === "combined-ems-fd") {
      await handlePanicButtonPressed({
        locale: user.locale,
        socket: this.socket,
        cad,
        status: code,
        unit: unit.unit,
      });
    } else if (unit.type === "ems-fd") {
      const fullDeputy = await prisma.emsFdDeputy.findUnique({
        where: { id: unit.unit.id },
        include: unitProperties,
      });

      await handlePanicButtonPressed({
        locale: user.locale,
        socket: this.socket,
        cad,
        status: code,
        unit: fullDeputy!,
      });
    }

    // reset all units for user
    if (!isDispatch) {
      if (unit.type === "leo") {
        await prisma.officer.updateMany({
          where: { userId: user.id },
          data: { activeCallId: null, activeIncidentId: null, statusId: null },
        });
      } else if (unit.type === "ems-fd") {
        await prisma.emsFdDeputy.updateMany({
          where: { userId: user.id },
          data: { statusId: null, activeCallId: null, activeIncidentId: null },
        });
      }
    }

    let updatedUnit: EmsFdDeputy | Officer | CombinedLeoUnit | null = null;
    const shouldFindIncremental =
      code.shouldDo === ShouldDoType.SET_ON_DUTY && !unit.unit.incremental;
    const statusId = code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id;

    const incremental = shouldFindIncremental
      ? await findNextAvailableIncremental({ type: unit.type })
      : undefined;

    if (unit.type === "leo") {
      updatedUnit = await prisma.officer.update({
        where: { id: unit.unit.id },
        data: {
          userDefinedCallsign,
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
          incremental,
        },
        include: leoProperties,
      });
    } else if (unit.type === "ems-fd") {
      updatedUnit = await prisma.emsFdDeputy.update({
        where: { id: unit.unit.id },
        data: {
          userDefinedCallsign,
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
          incremental,
        },
        include: unitProperties,
      });
    } else if (unit.type === "combined-leo") {
      updatedUnit = await prisma.combinedLeoUnit.update({
        where: { id: unit.unit.id },
        data: {
          userDefinedCallsign,
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
        },
        include: combinedUnitProperties,
      });
    } else {
      updatedUnit = await prisma.combinedEmsFdUnit.update({
        where: { id: unit.unit.id },
        data: {
          userDefinedCallsign,
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
        },
        include: combinedEmsFdUnitProperties,
      });
    }

    if (updatedUnit?.activeCallId) {
      createCallEventOnStatusChange({
        unit: updatedUnit,
        status: code,
        socket: this.socket,
      });
    }

    if (unit.type === "leo") {
      await handleStartEndOfficerLog({
        unit: unit.unit as Officer,
        shouldDo: code.shouldDo,
        socket: this.socket,
        userId: user.id,
        type: "leo",
      });
    } else if (unit.type === "ems-fd") {
      await handleStartEndOfficerLog({
        unit: unit.unit,
        shouldDo: code.shouldDo,
        socket: this.socket,
        userId: user.id,
        type: "ems-fd",
      });
    } else {
      if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        if (unit.type === "combined-ems-fd") {
          await prisma.combinedEmsFdUnit
            .delete({
              where: { id: unit.unit.id },
            })
            .catch(() => null);
        } else {
          await prisma.combinedLeoUnit
            .delete({
              where: { id: unit.unit.id },
            })
            .catch(() => null);
        }
      }
    }

    if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      this.socket.emitSetUnitOffDuty(unit.unit.id);

      await prisma.dispatchChat.deleteMany({
        where: { unitId: unit.unit.id },
      });
    }

    if (unit.type === "leo" || unit.type === "combined-leo") {
      await this.socket.emitUpdateOfficerStatus();
    } else {
      await this.socket.emitUpdateDeputyStatus();
    }

    this.socket.emitUpdateUnitStatus(updatedUnit);

    try {
      const data = await createWebhookData({
        cad,
        // @ts-expect-error unit.type mismatch. the types are correct.
        unit: updatedUnit,
        locale: user.locale,
      });
      await sendDiscordWebhook({ type: DiscordWebhookType.UNIT_STATUS, data });
      await sendRawWebhook({ type: DiscordWebhookType.UNIT_STATUS, data: updatedUnit });
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }

    // @ts-expect-error unit.type mismatch. the types are correct.
    return updatedUnit;
  }
}

function getDivisionsFromUnit(
  unit: Awaited<ReturnType<typeof findUnit>>,
  isDivisionsFeatureEnabled: boolean,
) {
  if (!isDivisionsFeatureEnabled || !unit.unit) {
    return [];
  }

  if (unit.type === "leo") {
    return unit.unit.divisions.map((v: DivisionValue) => v.id);
  }

  if (unit.type === "ems-fd" && unit.unit.divisionId) {
    return [unit.unit.divisionId];
  }

  return [];
}
