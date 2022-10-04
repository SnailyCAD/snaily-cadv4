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
  DiscordWebhookType,
  Rank,
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
import { generateCallsign } from "@snailycad/utils/callsign";
import { validateSchema } from "lib/validateSchema";
import { handleStartEndOfficerLog } from "lib/leo/handleStartEndOfficerLog";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { findUnit } from "lib/leo/findUnit";
import { isFeatureEnabled } from "lib/cad";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import type * as APITypes from "@snailycad/types/api";

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

      await this.handlePanicButtonPressed({
        cad,
        status: code,
        unit: officer!,
      });
    }

    if (type === "combined") {
      await this.handlePanicButtonPressed({
        cad,
        status: code,
        unit,
      });
    } else if (type === "ems-fd") {
      const fullDeputy = await prisma.emsFdDeputy.findUnique({
        where: { id: unit.id },
        include: unitProperties,
      });

      await this.handlePanicButtonPressed({
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

    let updatedUnit;
    const shouldFindIncremental = code.shouldDo === ShouldDoType.SET_ON_DUTY && !unit.incremental;
    const statusId = code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id;

    const incremental = shouldFindIncremental
      ? await findNextAvailableIncremental({ type })
      : undefined;

    if (type === "leo") {
      updatedUnit = await prisma.officer.update({
        where: { id: unit.id },
        data: { statusId, incremental, lastStatusChangeTimestamp: new Date() },
        include: leoProperties,
      });
    } else if (type === "ems-fd") {
      updatedUnit = await prisma.emsFdDeputy.update({
        where: { id: unit.id },
        data: { statusId, incremental, lastStatusChangeTimestamp: new Date() },
        include: unitProperties,
      });
    } else {
      updatedUnit = await prisma.combinedLeoUnit.update({
        where: { id: unit.id },
        data: { statusId, lastStatusChangeTimestamp: new Date() },
        include: combinedUnitProperties,
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

    try {
      const data = createWebhookData(cad, updatedUnit);
      await sendDiscordWebhook(DiscordWebhookType.UNIT_STATUS, data);
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }

    if (["leo", "combined"].includes(type)) {
      await this.socket.emitUpdateOfficerStatus();
    } else {
      await this.socket.emitUpdateDeputyStatus();
    }

    return updatedUnit;
  }

  private isUnitCurrentlyInPanicMode(unit: HandlePanicButtonPressedOptions["unit"]) {
    return unit.status?.shouldDo === ShouldDoType.PANIC_BUTTON;
  }

  private isStatusPanicButton(status: StatusValue) {
    return status.shouldDo === ShouldDoType.PANIC_BUTTON;
  }

  private async handlePanicButtonPressed(options: HandlePanicButtonPressedOptions) {
    const isCurrentlyPanicMode = this.isUnitCurrentlyInPanicMode(options.unit);
    const isPanicButton = this.isStatusPanicButton(options.status);

    const shouldEnablePanicMode = !isCurrentlyPanicMode && isPanicButton;

    if (shouldEnablePanicMode) {
      this.socket.emitPanicButtonLeo(options.unit, "ON");

      try {
        const embed = createPanicButtonEmbed(options.cad, options.unit);
        await sendDiscordWebhook(DiscordWebhookType.PANIC_BUTTON, embed);
      } catch (error) {
        console.error("[cad_panicButton]: Could not send Discord webhook.", error);
      }
    } else {
      this.socket.emitPanicButtonLeo(options.unit, "OFF");
    }
  }
}

interface HandlePanicButtonPressedOptions {
  status: StatusValue;
  unit: (
    | ((Officer | EmsFdDeputy) & { citizen: Pick<Citizen, "name" | "surname"> })
    | CombinedLeoUnit
  ) & {
    status?: StatusValue | null;
  };
  cad: cad & { miscCadSettings: MiscCadSettings };
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
  unit: HandlePanicButtonPressedOptions["unit"],
) {
  const isCombined = !("citizen" in unit);

  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: cad.features,
  });

  const unitName = isCombined ? null : `${unit.citizen.name} ${unit.citizen.surname}`;
  const template = isCombined
    ? cad.miscCadSettings.pairedUnitSymbol
    : cad.miscCadSettings.callsignTemplate;

  const callsign = generateCallsign(unit as any, template);
  const badgeNumber = isBadgeNumberEnabled || isCombined ? "" : `${unit.badgeNumber} - `;
  const officerName = isCombined ? `${callsign}` : `${badgeNumber}${callsign} ${unitName}`;

  return {
    embeds: [
      {
        title: "Panic Button",
        description: `Unit **${officerName}** has pressed the panic button`,
      },
    ],
  };
}
