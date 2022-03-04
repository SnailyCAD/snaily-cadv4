import { Controller } from "@tsed/di";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { Description, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ShouldDoType } from "@prisma/client";
import type { Socket } from "services/SocketService";
import { IsAuth } from "middlewares/IsAuth";

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
  async mergeOfficers(@BodyParams() ids: { entry?: boolean; id: string }[]) {
    const officers = await prisma.$transaction(
      ids.map((officer) => {
        return prisma.officer.findFirst({
          where: {
            id: officer.id,
          },
        });
      }),
    );

    if (officers.some((v) => v === null)) {
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

    const combinedUnit = await prisma.combinedLeoUnit.create({
      data: {
        statusId: status?.id ?? null,
        callsign: entryOfficer.callsign,
        callsign2: entryOfficer.callsign2,
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
    this.socket.emitUpdateOfficerStatus();

    return last;
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
