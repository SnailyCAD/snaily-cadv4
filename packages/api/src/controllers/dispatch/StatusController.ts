import {
  User,
  ShouldDoType,
  MiscCadSettings,
  cad,
  Officer,
  StatusValue,
  EmsFdDeputy,
  Citizen,
  CombinedLeoUnit,
  Value,
  WhitelistStatus,
  CadFeature,
  Feature,
} from "@prisma/client";
import { UPDATE_OFFICER_STATUS_SCHEMA } from "@snailycad/schemas";
import { Req, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Description, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { callInclude } from "./911-calls/Calls911Controller";
import { combinedUnitProperties, leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import { Socket } from "services/SocketService";
import { IsAuth } from "middlewares/IsAuth";
import { generateCallsign } from "@snailycad/utils/callsign";
import { validateSchema } from "lib/validateSchema";
import { handleStartEndOfficerLog } from "lib/leo/handleStartEndOfficerLog";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { findUnit } from "lib/leo/findUnit";
import { isFeatureEnabled } from "lib/cad";
import { hasPermission } from "@snailycad/permissions";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
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
  ) {
    const data = validateSchema(UPDATE_OFFICER_STATUS_SCHEMA, body);
    const bodyStatusId = data.status;

    const isFromDispatch = req.headers["is-from-dispatch"]?.toString() === "true";
    const isDispatch =
      isFromDispatch &&
      (hasPermission(user.permissions, [Permissions.Dispatch]) || user.isDispatch);

    const { type, unit } = await findUnit(unitId, { userId: isDispatch ? undefined : user.id });

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    if ("suspended" in unit && unit.suspended) {
      throw new BadRequest("unitSuspended");
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

    const code = await prisma.statusValue.findFirst({
      where: { id: bodyStatusId },
      include: { value: true },
    });

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

      if (
        officer?.status?.shouldDo === ShouldDoType.PANIC_BUTTON &&
        code.shouldDo !== ShouldDoType.PANIC_BUTTON
      ) {
        this.socket.emitPanicButtonLeo(officer, "OFF");
      } else if (
        officer?.status?.shouldDo !== ShouldDoType.PANIC_BUTTON &&
        code.shouldDo === ShouldDoType.PANIC_BUTTON
      ) {
        this.socket.emitPanicButtonLeo(officer, "ON");

        if (cad.miscCadSettings.panicButtonWebhookId && officer) {
          try {
            const embed = createPanicButtonEmbed(cad, officer);
            await sendDiscordWebhook(cad.miscCadSettings, "panicButtonWebhookId", embed);
          } catch (error) {
            console.error("[cad_panicButton]: Could not send Discord webhook.", error);
          }
        }
      }
    }

    if (type === "combined") {
      if (
        (unit as any)?.status?.shouldDo === ShouldDoType.PANIC_BUTTON &&
        code.shouldDo !== ShouldDoType.PANIC_BUTTON
      ) {
        this.socket.emitPanicButtonLeo(unit, "OFF");
      } else if (
        (unit as any)?.status?.shouldDo !== ShouldDoType.PANIC_BUTTON &&
        code.shouldDo === ShouldDoType.PANIC_BUTTON
      ) {
        this.socket.emitPanicButtonLeo(unit, "ON");
      }
    }

    // reset all units for user
    if (!isDispatch) {
      if (type === "leo") {
        await prisma.officer.updateMany({
          where: { userId: user.id },
          data: {
            statusId: null,
          },
        });
      } else if (type === "ems-fd") {
        await prisma.emsFdDeputy.updateMany({
          where: { userId: user.id },
          data: {
            statusId: null,
          },
        });
      }
    }

    let updatedUnit;
    const statusId = code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id;

    if (type === "leo") {
      updatedUnit = await prisma.officer.update({
        where: { id: unit.id },
        data: { statusId },
        include: leoProperties,
      });
    } else if (type === "ems-fd") {
      updatedUnit = await prisma.emsFdDeputy.update({
        where: { id: unit.id },
        data: { statusId },
        include: unitProperties,
      });
    } else {
      updatedUnit = await prisma.combinedLeoUnit.update({
        where: { id: unit.id },
        data: { statusId },
        include: combinedUnitProperties,
      });
    }

    if (type === "leo") {
      await handleStartEndOfficerLog({
        officer: unit as Officer,
        shouldDo: code.shouldDo,
        socket: this.socket,
        userId: user.id,
      });
    } else if (type === "ems-fd") {
      // unassign deputy from call
      if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        const calls = await prisma.call911.findMany({
          where: {
            assignedUnits: { some: { emsFdDeputyId: unit.id } },
          },
          include: callInclude,
        });

        calls.forEach((call) => {
          const assignedUnits = call.assignedUnits.filter((v) => v.emsFdDeputyId !== unit.id);
          this.socket.emitUpdate911Call({ ...call, assignedUnits });
        });

        await prisma.assignedUnit.deleteMany({
          where: {
            emsFdDeputyId: unit.id,
          },
        });
      }
    } else {
      if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        await prisma.combinedLeoUnit.delete({
          where: {
            id: unit.id,
          },
        });
      }
    }

    try {
      const data = createWebhookData(cad, updatedUnit);
      await sendDiscordWebhook(cad.miscCadSettings, "statusesWebhookId", data);
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }

    if (["leo", "combined"].includes(type)) {
      this.socket.emitUpdateOfficerStatus();
    } else {
      this.socket.emitUpdateDeputyStatus();
    }

    return updatedUnit;
  }
}

type V<T> = T & { value: Value };

export type Unit = { status: V<StatusValue> | null } & (
  | ((Officer | EmsFdDeputy) & {
      citizen: Pick<Citizen, "name" | "surname">;
    })
  | CombinedLeoUnit
);

function createWebhookData(
  cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  unit: Unit,
) {
  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: cad.features,
  });

  const isNotCombined = "citizenId" in unit;

  const status = unit.status?.value.value ?? "Off-duty";
  const unitName = isNotCombined ? `${unit.citizen.name} ${unit.citizen.surname}` : "";
  const callsign = generateCallsign(unit as any, cad.miscCadSettings.callsignTemplate);
  const badgeNumber = isBadgeNumberEnabled && isNotCombined ? `${unit.badgeNumber} - ` : "";
  const officerName = isNotCombined ? `${badgeNumber}${callsign} ${unitName}` : `${callsign}`;

  return {
    embeds: [
      {
        title: "Status Change",
        description: `Unit **${officerName}** has changed their status to ${status}`,
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

function createPanicButtonEmbed(
  cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  unit: Officer & { citizen: Pick<Citizen, "name" | "surname"> },
) {
  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: cad.features,
  });

  const unitName = `${unit.citizen.name} ${unit.citizen.surname}`;
  const callsign = generateCallsign(unit as any, cad.miscCadSettings.callsignTemplate);
  const badgeNumber = isBadgeNumberEnabled ? `${unit.badgeNumber} - ` : "";
  const officerName = `${badgeNumber}${callsign} ${unitName}`;

  return {
    embeds: [
      {
        title: "Panic Button",
        description: `Unit **${officerName}** has pressed the panic button`,
      },
    ],
  };
}
