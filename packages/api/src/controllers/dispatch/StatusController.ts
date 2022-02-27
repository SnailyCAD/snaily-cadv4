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
import { Description, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { callInclude, findUnit } from "./911-calls/Calls911Controller";
import { leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import { Socket } from "services/SocketService";
import { IsAuth } from "middlewares/index";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Citizen, CombinedLeoUnit, Value, WhitelistStatus } from "@prisma/client";
import { generateCallsign } from "@snailycad/utils";
import { validateSchema } from "lib/validateSchema";
import { handleStartEndOfficerLog } from "lib/leo/handleStartEndOfficerLog";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
export class StatusController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Put("/:unitId")
  @Description("Update the status of a unit by its id.")
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
        include: {
          status: { select: { shouldDo: true } },
          department: true,
          whitelistStatus: leoProperties.whitelistStatus,
        },
      });

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
      }

      const isOfficerDisabled = officer?.whitelistStatus
        ? officer.whitelistStatus.status !== WhitelistStatus.ACCEPTED &&
          !officer.department?.isDefaultDepartment
        : false;

      if (isOfficerDisabled) {
        throw new BadRequest("cannotUseThisOfficer");
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
        include: { status: { include: { value: true } }, officers: { include: leoProperties } },
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
      const data = createWebhookData(cad.miscCadSettings, updatedUnit);
      await sendDiscordWebhook(cad.miscCadSettings, "statusesWebhookId", data);
    } catch (error) {
      console.log("Could not send Discord webhook.", error);
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
  @Description("Merge officers by the activeOfficer and an officerId into a combinedLeoUnit")
  async mergeOfficers(
    @BodyParams("id") id: string,
    @Context("activeOfficer") activeOfficer: Officer,
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

    const unit = await prisma.combinedLeoUnit.create({
      data: {
        statusId: status?.id ?? null,
        callsign: activeOfficer.callsign,
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
  @Description("Unmerge officers by the combinedUnitId")
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
      citizen: Pick<Citizen, "name" | "surname">;
    })
  | CombinedLeoUnit
);

function createWebhookData(miscCadSettings: MiscCadSettings, unit: Unit) {
  const isNotCombined = "citizenId" in unit;

  const status = unit.status?.value.value ?? "Off-duty";
  const unitName = isNotCombined ? `${unit.citizen.name} ${unit.citizen.surname}` : "";
  // todo: fix type
  const callsign = generateCallsign(unit as any, miscCadSettings.callsignTemplate);
  const officerName = isNotCombined
    ? `${unit.badgeNumber} - ${callsign} ${unitName}`
    : `${callsign}`;

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
