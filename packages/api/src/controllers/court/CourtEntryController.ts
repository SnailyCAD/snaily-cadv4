import { Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { COURT_ENTRY_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";

@Controller("/court-entries")
@UseBeforeEach(IsAuth)
export class CourtEntryController {
  @Get("/")
  async getCourtEntries() {
    const entries = await prisma.courtEntry.findMany({
      include: { dates: true },
    });

    return entries;
  }

  @Post("/")
  async createCourtEntry(@BodyParams() body: unknown) {
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
  async updateCourtEntry(@PathParams("id") id: string, @BodyParams() body: unknown) {
    const data = validateSchema(COURT_ENTRY_SCHEMA, body);

    const entry = await prisma.courtEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFound("entryNotFound");
    }

    const updated = await prisma.courtEntry.update({
      where: { id: entry.id },
      data: {
        title: data.title,
        caseNumber: data.caseNumber,
        descriptionData: data.descriptionData,
      },
    });

    // todo
    const dates = [];

    return { ...updated, dates };
  }
}
