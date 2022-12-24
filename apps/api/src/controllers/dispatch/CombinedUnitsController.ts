import { Controller } from "@tsed/di";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ShouldDoType } from "@prisma/client";
import { Socket } from "services/socket-service";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { combinedUnitProperties } from "lib/leo/activeOfficer";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import type * as APITypes from "@snailycad/types/api";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class CombinedUnitsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/merge")
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

    const nextInt = await findNextAvailableIncremental({ type: "combined" });
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

  @Post("/unmerge/:id")
  @Description("Unmerge officers by the combinedUnitId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
  async unmergeOfficers(
    @PathParams("id") unitId: string,
  ): Promise<APITypes.PostDispatchStatusUnmergeUnitById> {
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

    await prisma.$transaction(
      unit.officers.map(({ id }) => {
        return prisma.officer.update({
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

    await this.socket.emitUpdateOfficerStatus();

    return true;
  }
}
