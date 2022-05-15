import { BodyParams, Controller, UseBeforeEach } from "@tsed/common";
import { IsAuth } from "middlewares/IsAuth";
import { Post } from "@tsed/schema";
import { validateSchema } from "lib/validateSchema";
import { NOTE_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/prisma";
import { NotFound } from "@tsed/exceptions";

@Controller("/notes")
@UseBeforeEach(IsAuth)
export class NotesController {
  @Post("/")
  async addNoteToItem(@BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    const prismaNames = {
      CITIZEN: "citizen",
      VEHICLE: "registeredVehicle",
    } as const;

    const name = prismaNames[data.type as keyof typeof prismaNames];

    // @ts-expect-error methods have the same properties here.
    const item = await prisma[name].findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFound("citizenNotFound");
    }

    const note = await prisma.note.create({
      data: {
        text: data.text,
        [data.type === "CITIZEN" ? "citizenId" : "vehicleId"]: item.id,
        // createdBy todo
      },
    });

    return note;
  }
}
