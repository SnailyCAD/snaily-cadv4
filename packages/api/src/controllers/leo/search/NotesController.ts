import { BodyParams, Controller, PathParams, UseBeforeEach } from "@tsed/common";
import { IsAuth } from "middlewares/IsAuth";
import { Delete, Post, Put } from "@tsed/schema";
import { validateSchema } from "lib/validateSchema";
import { NOTE_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/prisma";
import { NotFound } from "@tsed/exceptions";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type { Citizen, RegisteredVehicle } from "@prisma/client";

@Controller("/notes")
@UseBeforeEach(IsAuth)
export class NotesController {
  @Post("/")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.EmsFd, Permissions.Dispatch],
    fallback: (u) => u.isLeo || u.isEmsFd || u.isDispatch,
  })
  async addNoteToItem(@BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    const item = await this.findItem(data);
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
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.EmsFd, Permissions.Dispatch],
    fallback: (u) => u.isLeo || u.isEmsFd || u.isDispatch,
  })
  async editNoteFromItem(@PathParams("id") noteId: string, @BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    await this.findItem(data);

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { text: data.text },
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.EmsFd, Permissions.Dispatch],
    fallback: (u) => u.isLeo || u.isEmsFd || u.isDispatch,
  })
  async deleteNoteFromItem(@PathParams("id") noteId: string, @BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    await this.findItem(data);

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

  protected async findItem<T extends Citizen | RegisteredVehicle>(
    data: Zod.infer<typeof NOTE_SCHEMA>,
  ) {
    const name = this.getPrismaName(data);
    // @ts-expect-error methods have the same properties here.
    const item = await prisma[name].findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFound("itemNotFound");
    }

    return item as T;
  }
}
