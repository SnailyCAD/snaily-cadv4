import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { COURT_ENTRY_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type * as APITypes from "@snailycad/types/api";
import { Feature } from "@snailycad/types";
import { IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/court-entries")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.COURTHOUSE })
export class CourtEntryController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async getCourtEntries(): Promise<APITypes.GetCourtEntriesData> {
    const entries = await prisma.courtEntry.findMany({
      include: { dates: true },
      orderBy: { createdAt: "desc" },
    });

    return entries;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createCourtEntry(@BodyParams() body: unknown): Promise<APITypes.PostCourtEntriesData> {
    const data = validateSchema(COURT_ENTRY_SCHEMA, body);

    const entry = await prisma.courtEntry.create({
      data: {
        title: data.title,
        caseNumber: data.caseNumber,
        descriptionData: data.descriptionData,
      },
    });

    const dates = await prisma.$transaction(
      data.dates.map((date) =>
        prisma.courtDate.create({
          data: {
            date: new Date(date.date),
            note: date.note,
            courtEntryId: entry.id,
          },
        }),
      ),
    );

    return { ...entry, dates };
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCourtEntry(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCourtEntriesData> {
    const data = validateSchema(COURT_ENTRY_SCHEMA, body);

    const entry = await prisma.courtEntry.findUnique({
      where: { id },
      include: { dates: true },
    });

    if (!entry) {
      throw new NotFound("entryNotFound");
    }

    await prisma.$transaction(
      entry.dates.map((date) => prisma.courtDate.delete({ where: { id: date.id } })),
    );

    const updated = await prisma.courtEntry.update({
      where: { id: entry.id },
      data: {
        title: data.title,
        caseNumber: data.caseNumber,
        descriptionData: data.descriptionData,
      },
    });

    const dates = await prisma.$transaction(
      data.dates.map((date) =>
        prisma.courtDate.create({
          data: {
            date: new Date(date.date),
            note: date.note,
            courtEntryId: entry.id,
          },
        }),
      ),
    );

    return { ...updated, dates };
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async deleteCourtEntry(@PathParams("id") id: string): Promise<APITypes.DeleteCourtEntriesData> {
    const entry = await prisma.courtEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFound("entryNotFound");
    }

    await prisma.courtEntry.delete({
      where: { id },
    });

    return true;
  }
}
