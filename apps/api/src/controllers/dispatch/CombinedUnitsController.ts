import { Controller } from "@tsed/di";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { CombinedEmsFdUnit, CombinedLeoUnit, ShouldDoType } from "@prisma/client";
import { Socket } from "services/socket-service";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { combinedEmsFdUnitProperties, combinedUnitProperties } from "lib/leo/activeOfficer";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import type * as APITypes from "@snailycad/types/api";
import { getNextActiveCallId } from "lib/calls/getNextActiveCall";
import { getNextIncidentId } from "lib/incidents/get-next-incident-id";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class CombinedUnitsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/merge/leo")
  @Description(
    "Merge officers into a combined/merged unit via their ids. `entry: true` means it that officer will be the main unit.",
  )
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
  async mergeOfficers(
    @BodyParams() ids: { entry: boolean; id: string }[],
  ): Promise<APITypes.PostDispatchStatusMergeOfficers> {
    const officers = await prisma.$transaction(
      ids.map((officer) => {
        return prisma.officer.findFirst({
          where: {
            id: officer.id,
          },
        });
      }),
    );

    if (officers.includes(null)) {
      throw new BadRequest("officerNotFoundInArray");
    }

    const existing = officers.some((v) => v?.combinedLeoUnitId);
    if (existing) {
      throw new BadRequest("officerAlreadyMerged");
    }

    const entryOfficerId = ids.find((v) => v.entry)?.id;
    if (!entryOfficerId) {
      throw new BadRequest("noEntryOfficer");
    }

    const entryOfficer = await prisma.officer.findUnique({
      where: { id: entryOfficerId },
      include: { divisions: { take: 1, where: { pairedUnitTemplate: { not: null } } } },
    });

    if (!entryOfficer) {
      throw new BadRequest("noEntryOfficer");
    }

    const status = await prisma.statusValue.findFirst({
      where: { shouldDo: ShouldDoType.SET_ON_DUTY },
      select: { id: true },
    });

    const [division] = entryOfficer.divisions;

    const nextInt = await findNextAvailableIncremental({ type: "combined-leo" });
    const combinedUnit = await prisma.combinedLeoUnit.create({
      data: {
        statusId: status?.id ?? null,
        callsign: entryOfficer.callsign,
        callsign2: entryOfficer.callsign2,
        departmentId: entryOfficer.departmentId,
        incremental: nextInt,
        pairedUnitTemplate: division?.pairedUnitTemplate ?? null,
      },
    });

    const data = await Promise.all(
      ids.map(async ({ id: officerId }, idx) => {
        await prisma.officer.update({
          where: { id: officerId },
          data: { statusId: null },
        });

        return prisma.combinedLeoUnit.update({
          where: {
            id: combinedUnit.id,
          },
          data: {
            officers: { connect: { id: officerId } },
          },
          include: idx === ids.length - 1 ? combinedUnitProperties : undefined,
        });
      }),
    );

    const last = data[data.length - 1];
    await this.socket.emitUpdateOfficerStatus();

    return last as APITypes.PostDispatchStatusMergeOfficers;
  }

  @Post("/merge/ems-fd")
  @Description(
    "Merge ems-fd deputies into a combined/merged unit via their ids. `entry: true` means it that deputy will be the main unit.",
  )
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
  async mergeDeputies(
    @BodyParams() ids: { entry: boolean; id: string }[],
  ): Promise<APITypes.PostDispatchStatusMergeDeputies> {
    const deputies = await prisma.$transaction(
      ids.map((deputy) => {
        return prisma.emsFdDeputy.findFirst({
          where: {
            id: deputy.id,
          },
        });
      }),
    );

    if (deputies.includes(null)) {
      throw new BadRequest("deputyNotFoundInArray");
    }

    const existing = deputies.some((v) => v?.combinedEmsFdUnitId);
    if (existing) {
      throw new BadRequest("deputyAlreadyMerged");
    }

    const entryDeputyId = ids.find((v) => v.entry)?.id;
    if (!entryDeputyId) {
      throw new BadRequest("noEntryDeputy");
    }

    const entryDeputy = await prisma.emsFdDeputy.findUnique({
      where: { id: entryDeputyId },
      include: { division: true },
    });

    if (!entryDeputy) {
      throw new BadRequest("noEntryDeputy");
    }

    const status = await prisma.statusValue.findFirst({
      where: { shouldDo: ShouldDoType.SET_ON_DUTY },
      select: { id: true },
    });

    const nextInt = await findNextAvailableIncremental({ type: "combined-ems-fd" });
    const combinedUnit = await prisma.combinedEmsFdUnit.create({
      data: {
        statusId: status?.id ?? null,
        callsign: entryDeputy.callsign,
        callsign2: entryDeputy.callsign2,
        departmentId: entryDeputy.departmentId,
        incremental: nextInt,
        pairedUnitTemplate: entryDeputy.division?.pairedUnitTemplate ?? null,
      },
    });

    const data = await Promise.all(
      ids.map(async ({ id: deputyId }, idx) => {
        await prisma.emsFdDeputy.update({
          where: { id: deputyId },
          data: { statusId: null },
        });

        return prisma.combinedEmsFdUnit.update({
          where: {
            id: combinedUnit.id,
          },
          data: {
            deputies: { connect: { id: deputyId } },
          },
          include: idx === ids.length - 1 ? combinedEmsFdUnitProperties : undefined,
        });
      }),
    );

    const last = data[data.length - 1];
    await this.socket.emitUpdateDeputyStatus();

    return last as APITypes.PostDispatchStatusMergeDeputies;
  }

  @Post("/unmerge/:id")
  @Description("Unmerge officers by the combinedUnitId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
  async unmergeOfficers(
    @PathParams("id") unitId: string,
  ): Promise<APITypes.PostDispatchStatusUnmergeUnitById> {
    let unit:
      | (CombinedLeoUnit & { officers: any[] })
      | (CombinedEmsFdUnit & { deputies: any[] })
      | null = await prisma.combinedLeoUnit.findFirst({
      where: { id: unitId },
      include: { officers: { select: { id: true } } },
    });

    if (!unit) {
      unit = await prisma.combinedEmsFdUnit.findFirst({
        where: { id: unitId },
        include: { deputies: { select: { id: true } } },
      });
    }

    if (!unit) {
      throw new NotFound("notFound");
    }

    const onDutyStatusCode = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.SET_ON_DUTY,
      },
    });

    const statusId = onDutyStatusCode?.id ?? unit.statusId ?? undefined;

    const [nextCallId, nextIncidentId] = await Promise.all([
      getNextActiveCallId({
        callId: "null",
        type: "unassign",
        unit,
      }),
      getNextIncidentId({
        incidentId: "null",
        type: "unassign",
        unit,
      }),
    ]);

    const units = "officers" in unit ? unit.officers : unit.deputies;
    const prismaModelName = "officers" in unit ? "officer" : "emsFdDeputy";
    const combinedPrismaModelName = "officers" in unit ? "combinedLeoUnit" : "combinedEmsFdUnit";
    const prismaKey = "officers" in unit ? "combinedLeoId" : "combinedEmsFdId";

    await prisma.$transaction(
      units.map(({ id }) => {
        // @ts-expect-error model name is dynamic
        return prisma[prismaModelName].update({
          where: { id },
          data: { statusId, activeCallId: nextCallId, activeIncidentId: nextIncidentId },
        });
      }),
    );

    await prisma.$transaction([
      prisma.assignedUnit.deleteMany({
        where: { [prismaKey]: unitId },
      }),
      prisma.incidentInvolvedUnit.deleteMany({
        where: { [prismaKey]: unitId },
      }),
      // @ts-expect-error model name is dynamic
      prisma[combinedPrismaModelName].delete({
        where: { id: unitId },
      }),
    ]);

    await this.socket.emitUpdateOfficerStatus();
    await this.socket.emitUpdateDeputyStatus();

    return true;
  }
}
