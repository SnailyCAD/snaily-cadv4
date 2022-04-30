import { Controller } from "@tsed/di";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { Description, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ShouldDoType } from "@prisma/client";
import { Socket } from "services/SocketService";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@Controller("/dispatch/status")
@UseBeforeEach(IsAuth)
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
  async mergeOfficers(@BodyParams() ids: { entry: boolean; id: string }[]) {
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
    });

    if (!entryOfficer) {
      throw new BadRequest("noEntryOfficer");
    }

    const status = await prisma.statusValue.findFirst({
      where: { shouldDo: ShouldDoType.SET_ON_DUTY },
      select: { id: true },
    });

    const nextInt = await this.findNextAvailableIncremental();
    const combinedUnit = await prisma.combinedLeoUnit.create({
      data: {
        statusId: status?.id ?? null,
        callsign: entryOfficer.callsign,
        callsign2: entryOfficer.callsign2,
        departmentId: entryOfficer.departmentId,
        incremental: nextInt,
      },
    });

    const data = await Promise.all(
      ids.map(async ({ id: officerId }) => {
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
        });
      }),
    );

    const last = data[data.length - 1];
    await this.socket.emitUpdateOfficerStatus();

    return last;
  }

  @Post("/unmerge/:id")
  @Description("Unmerge officers by the combinedUnitId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo],
  })
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
  }

  /**
   * find the first smallest missing item from an array
   */
  protected async findNextAvailableIncremental() {
    const units = await prisma.combinedLeoUnit.findMany({
      where: { incremental: { not: null } },
    });

    const incrementalNumbers = units.map((v) => v.incremental!);
    const sorted = incrementalNumbers.sort((a, b) => a - b);
    let nextIncremental = 1;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] === nextIncremental) nextIncremental++;
    }

    return nextIncremental;
  }
}
