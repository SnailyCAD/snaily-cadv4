import {
  User,
  ShouldDoType,
  MiscCadSettings,
  cad,
  Officer,
  CombinedLeoUnit,
  EmsFdDeputy,
  WhitelistStatus,
  CadFeature,
  DiscordWebhookType,
  Rank,
  Feature,
} from "@prisma/client";
import { UPDATE_OFFICER_STATUS_SCHEMA } from "@snailycad/schemas";
import { Req, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Description, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { combinedUnitProperties, leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import { Socket } from "services/SocketService";
import { IsAuth } from "middlewares/IsAuth";
import { validateSchema } from "lib/validateSchema";
import { handleStartEndOfficerLog } from "lib/leo/handleStartEndOfficerLog";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { findUnit } from "lib/leo/findUnit";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import type * as APITypes from "@snailycad/types/api";
import { createWebhookData } from "lib/dispatch/webhooks";
import { createCallEventOnStatusChange } from "lib/dispatch/createCallEventOnStatusChange";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { isUnitOfficer } from "@snailycad/utils";
import { isFeatureEnabled } from "lib/cad";
import { handlePanicButtonPressed } from "lib/leo/send-panic-button-webhook";

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
    fallback: (u) => u.isLeo || u.isSupervisor || u.isDispatch || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async updateUnitStatus(
    @PathParams("unitId") unitId: string,
    @Context("user") user: User,
    @BodyParams() body: unknown,
    @Req() req: Req,
    @Context("cad") cad: cad & { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutDispatchStatusByUnitId> {
    const data = validateSchema(UPDATE_OFFICER_STATUS_SCHEMA, body);
    const bodyStatusId = data.status;

    const isFromDispatch = req.headers["is-from-dispatch"]?.toString() === "true";
    const isAdmin = hasPermission({
      userToCheck: user,
      permissionsToCheck: defaultPermissions.allDefaultAdminPermissions,
      fallback: (user) => user.rank !== Rank.USER,
    });
    const isDispatch =
      isAdmin ||
      (isFromDispatch &&
        hasPermission({
          userToCheck: user,
          permissionsToCheck: [Permissions.Dispatch],
          fallback: (user) => user.isDispatch,
        }));

    const isDivisionsEnabled = isFeatureEnabled({
      defaultReturn: true,
      feature: Feature.DIVISIONS,
      features: cad.features ?? [],
    });

    const { type, unit } = await findUnit(unitId, { userId: isDispatch ? undefined : user.id });

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    if ("suspended" in unit && unit.suspended) {
      throw new BadRequest("unitSuspended");
    }

    const code = await prisma.statusValue.findFirst({
      where: { id: bodyStatusId },
      include: { value: true },
    });

    let activeEmergencyVehicleId: string | undefined;
    if (data.vehicleId && code?.shouldDo === ShouldDoType.SET_ON_DUTY) {
      const divisionIds = isDivisionsEnabled
        ? // @ts-expect-error type mismatch
          isUnitOfficer(unit)
          ? unit.divisions.map((v) => v.id)
          : [(unit as EmsFdDeputy).divisionId ?? undefined]
        : [];

      const _emergencyVehicle = await prisma.emergencyVehicleValue.findFirst({
        where: {
          id: data.vehicleId,
          AND: [
            ...divisionIds.map((id) => ({ divisions: { some: { id } } })),
            unit.departmentId ? { departments: { some: { id: unit.departmentId } } } : {},
          ],
        },
      });

      if (!_emergencyVehicle) {
        throw new ExtendedNotFound({ vehicleId: "vehicleNotFound" });
      }

      activeEmergencyVehicleId = _emergencyVehicle.id;
    }

    /**
     * officer's status cannot be changed when in a combined unit
     * -> the combined unit's status must be updated.
     */
    if (type === "leo" && !isDispatch) {
      const hasCombinedUnit = await prisma.combinedLeoUnit.findFirst({
        where: {
          officers: { some: { id: unit.id } },
        },
      });

      if (hasCombinedUnit) {
        throw new BadRequest("officerIsCombined");
      }
    }

    if (!code) {
      throw new NotFound("statusNotFound");
    }

    if (type === "leo") {
      const officer = await prisma.officer.findUnique({
        where: { id: unit.id },
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

    if (type === "combined") {
      await handlePanicButtonPressed({
        locale: user.locale,
        socket: this.socket,
        cad,
        status: code,
        unit,
      });
    } else if (type === "ems-fd") {
      const fullDeputy = await prisma.emsFdDeputy.findUnique({
        where: { id: unit.id },
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
      if (type === "leo") {
        await prisma.officer.updateMany({
          where: { userId: user.id },
          data: { activeCallId: null, statusId: null },
        });
      } else if (type === "ems-fd") {
        await prisma.emsFdDeputy.updateMany({
          where: { userId: user.id },
          data: { statusId: null, activeCallId: null },
        });
      }
    }

    let updatedUnit: EmsFdDeputy | Officer | CombinedLeoUnit | null = null;
    const shouldFindIncremental = code.shouldDo === ShouldDoType.SET_ON_DUTY && !unit.incremental;
    const statusId = code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id;

    const incremental = shouldFindIncremental
      ? await findNextAvailableIncremental({ type })
      : undefined;

    if (type === "leo") {
      updatedUnit = await prisma.officer.update({
        where: { id: unit.id },
        data: {
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
          incremental,
          lastStatusChangeTimestamp: new Date(),
        },
        include: leoProperties,
      });
    } else if (type === "ems-fd") {
      updatedUnit = await prisma.emsFdDeputy.update({
        where: { id: unit.id },
        data: {
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
          incremental,
          lastStatusChangeTimestamp: new Date(),
        },
        include: unitProperties,
      });
    } else {
      updatedUnit = await prisma.combinedLeoUnit.update({
        where: { id: unit.id },
        data: {
          activeVehicleId: activeEmergencyVehicleId,
          statusId,
          lastStatusChangeTimestamp: new Date(),
        },
        include: combinedUnitProperties,
      });
    }

    if (updatedUnit?.activeCallId) {
      createCallEventOnStatusChange({
        unit: updatedUnit,
        status: code,
        socket: this.socket,
      });
    }

    if (type === "leo") {
      await handleStartEndOfficerLog({
        unit: unit as Officer,
        shouldDo: code.shouldDo,
        socket: this.socket,
        userId: user.id,
        type: "leo",
      });
    } else if (type === "ems-fd") {
      await handleStartEndOfficerLog({
        unit,
        shouldDo: code.shouldDo,
        socket: this.socket,
        userId: user.id,
        type: "ems-fd",
      });
    } else {
      if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        await prisma.combinedLeoUnit.delete({
          where: {
            id: unit.id,
          },
        });
      }
    }

    if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      this.socket.emitSetUnitOffDuty(unit.id);
    }

    if (["leo", "combined"].includes(type)) {
      await this.socket.emitUpdateOfficerStatus();
    } else {
      await this.socket.emitUpdateDeputyStatus();
    }

    try {
      const data = await createWebhookData({
        cad,
        // @ts-expect-error type mismatch. the types are correct.
        unit: updatedUnit,
        locale: user.locale,
      });
      await sendDiscordWebhook({ type: DiscordWebhookType.UNIT_STATUS, data });
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }

    // @ts-expect-error type mismatch. the types are correct.
    return updatedUnit;
  }
}
