import { BodyParams, Controller, PathParams, UseBeforeEach } from "@tsed/common";
import { IsAuth } from "middlewares/IsAuth";
import { Delete, Post, Put } from "@tsed/schema";
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

    const name = this.getPrismaName(data);
    // @ts-expect-error methods have the same properties here.
    const item = await prisma[name].findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFound("itemNotFound");
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

  @Put("/:id")
  async editNoteFromItem(@PathParams("id") noteId: string, @BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    const name = this.getPrismaName(data);
    // @ts-expect-error methods have the same properties here.
    const item = await prisma[name].findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFound("itemNotFound");
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { text: data.text },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteNoteFromItem(@PathParams("id") noteId: string, @BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    const name = this.getPrismaName(data);
    // @ts-expect-error methods have the same properties here.
    const item = await prisma[name].findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFound("itemNotFound");
    }

    await prisma.note.delete({ where: { id: noteId } });

    return true;
  }

  protected getPrismaName(data: Zod.infer<typeof NOTE_SCHEMA>) {
    const prismaNames = {
      CITIZEN: "citizen",
      VEHICLE: "registeredVehicle",
    } as const;

    const name = prismaNames[data.type as keyof typeof prismaNames];
    return name;
  }
}
