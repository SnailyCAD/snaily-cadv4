import {
  User,
  ShouldDoType,
  MiscCadSettings,
  cad,
  Officer,
  StatusValue,
  EmsFdDeputy,
} from ".prisma/client";
import { UPDATE_OFFICER_STATUS_SCHEMA } from "@snailycad/schemas";
import { Req, UseBeforeEach, UseBefore } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { callInclude, findUnit } from "./Calls911Controller";
import { leoProperties, unitProperties } from "lib/officer";
import { getWebhookData, sendDiscordWebhook } from "lib/discord";
import { Socket } from "services/SocketService";
import { APIWebhook } from "discord-api-types";
import { IsAuth } from "middlewares/index";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Citizen, CombinedLeoUnit, DepartmentValue, DivisionValue, Value } from "@prisma/client";
import { generateCallsign } from "utils/callsign";
import { validateSchema } from "lib/validateSchema";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
export class StatusController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Put("/:unitId")
  async updateUnitStatus(
    @PathParams("unitId") unitId: string,
    @Context("user") user: User,
    @BodyParams() body: unknown,
    @Req() req: Req,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
  ) {
    const data = validateSchema(UPDATE_OFFICER_STATUS_SCHEMA, body);
    const bodyStatusId = data.status;

    const isFromDispatch = req.headers["is-from-dispatch"]?.toString() === "true";
    const isDispatch = isFromDispatch && user.isDispatch;

    const { type, unit } = await findUnit(
      unitId,
      { userId: isDispatch ? undefined : user.id },
      true,
    );

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
        select: { department: true, whitelistStatus: leoProperties.whitelistStatus },
      });

      console.log({ officer, whitelist: officer?.whitelistStatus });

      const isOfficerDisabled = officer?.whitelistStatus
        ? officer.whitelistStatus.status !== "ACCEPTED" && !officer.department?.isDefaultDepartment
        : false;

      if (isOfficerDisabled) {
        throw new BadRequest("cannotUseThisOfficer");
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
        include: { status: { include: { value: true } }, officers: { include: leoProperties } },
      });
    }

    if (type === "leo") {
      /**
       * find an officer-log that has not ended yet.
       */
      const officerLog = await prisma.officerLog.findFirst({
        where: {
          officerId: unit.id,
          endedAt: null,
        },
      });

      if (code.shouldDo === ShouldDoType.SET_ON_DUTY) {
        /**
         * if the officer is being set on-duty, it will create the officer-log.
         */
        if (!officerLog) {
          await prisma.officerLog.create({
            data: {
              officerId: unit.id,
              userId: user.id,
              startedAt: new Date(),
            },
          });
        }
      } else if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
        const calls = await prisma.call911.findMany({
          where: {
            assignedUnits: { some: { officerId: unit.id } },
          },
          include: callInclude,
        });

        calls.forEach((call) => {
          const assignedUnits = call.assignedUnits.filter((v) => v.officerId !== unit.id);
          this.socket.emitUpdate911Call({ ...call, assignedUnits });
        });

        // unassign officer from call
        await prisma.assignedUnit.deleteMany({
          where: {
            officerId: unit.id,
          },
        });

        /**
         * end the officer-log.
         */
        if (officerLog) {
          await prisma.officerLog.update({
            where: {
              id: officerLog.id,
            },
            data: {
              endedAt: new Date(),
            },
          });
        }
      }
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

    if (cad.discordWebhookURL) {
      try {
        const webhook = await getWebhookData(cad.discordWebhookURL);
        if (!webhook) return;
        const data = createWebhookData(webhook, cad.miscCadSettings, updatedUnit);

        await sendDiscordWebhook(webhook, data);
      } catch (error) {
        console.log("Could not send Discord webhook.", error);
      }
    }

    if (["leo", "combined"].includes(type)) {
      this.socket.emitUpdateOfficerStatus();
    } else {
      this.socket.emitUpdateDeputyStatus();
    }

    return updatedUnit;
  }

  @UseBefore(ActiveOfficer)
  @Post("/merge")
  async mergeOfficers(
    @BodyParams("id") id: string,
    @Context("activeOfficer") activeOfficer: Officer,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
  ) {
    if (id === activeOfficer.id) {
      throw new BadRequest("officerAlreadyMerged");
    }

    const existing = await prisma.combinedLeoUnit.findFirst({
      where: {
        OR: [
          {
            officers: { some: { id } },
          },
          {
            officers: { some: { id: activeOfficer.id } },
          },
          {
            id,
          },
          {
            id: activeOfficer.id,
          },
        ],
      },
    });

    if (existing) {
      throw new BadRequest("officerAlreadyMerged");
    }

    const status = await prisma.statusValue.findFirst({
      where: { shouldDo: ShouldDoType.SET_ON_DUTY },
      select: { id: true },
    });

    const symbol = cad.miscCadSettings.pairedUnitSymbol || "A";
    const unit = await prisma.combinedLeoUnit.create({
      data: {
        statusId: status?.id ?? null,
        callsign: `1${symbol}-${activeOfficer.callsign2}`,
      },
    });

    const [, updated] = await Promise.all(
      [id, activeOfficer.id].map(async (idd) => {
        await prisma.officer.update({
          where: { id: idd },
          data: { statusId: null },
        });

        return prisma.combinedLeoUnit.update({
          where: {
            id: unit.id,
          },
          data: {
            officers: { connect: { id: idd } },
          },
        });
      }),
    );

    this.socket.emitUpdateOfficerStatus();

    return updated;
  }

  @Post("/unmerge/:id")
  async unmergeOfficers(@PathParams("id") unitId: string) {
    const unit = await prisma.combinedLeoUnit.findFirst({
      where: {
        id: unitId,
      },
      include: {
        officers: { select: { id: true } },
      },
    });

    if (!unit) {
      throw new NotFound("notFound");
    }

    await Promise.all(
      unit.officers.map(async ({ id }) => {
        await prisma.officer.update({
          where: { id },
          data: { statusId: unit.statusId },
        });
      }),
    );

    await prisma.assignedUnit.deleteMany({
      where: { combinedLeoId: unitId },
    });

    await prisma.combinedLeoUnit.delete({
      where: { id: unitId },
    });

    this.socket.emitUpdateOfficerStatus();
  }
}

type V<T> = T & { value: Value };

export type Unit = { status: V<StatusValue> | null } & (
  | ((Officer | EmsFdDeputy) & {
      department: V<DepartmentValue>;
      division: V<DivisionValue>;
      citizen: Pick<Citizen, "name" | "surname">;
      status: V<StatusValue> | null;
    })
  | CombinedLeoUnit
);

function createWebhookData(webhook: APIWebhook, miscCadSettings: MiscCadSettings, unit: Unit) {
  const isNotCombined = "citizenId" in unit;

  const status = unit.status?.value.value ?? "Off-duty";
  const unitName = isNotCombined ? `${unit.citizen.name} ${unit.citizen.surname}` : "";
  const callsign = isNotCombined ? generateCallsign(unit, miscCadSettings) : unit.callsign;
  const officerName = isNotCombined
    ? `${unit.badgeNumber} - ${callsign} ${unitName}`
    : `${callsign}`;

  return {
    avatar_url: webhook.avatar,
    embeds: [
      {
        title: "Status Change",
        type: "rich",
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
