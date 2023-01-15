import { BodyParams, Controller, PathParams, UseBeforeEach } from "@tsed/common";
import { IsAuth } from "middlewares/is-auth";
import { ContentType, Delete, Post, Put } from "@tsed/schema";
import { validateSchema } from "lib/data/validate-schema";
import { NOTE_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { NotFound } from "@tsed/exceptions";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type { Citizen, RegisteredVehicle } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";

@Controller("/notes")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class NotesController {
  @Post("/")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.EmsFd, Permissions.Dispatch],
    fallback: (u) => u.isLeo || u.isEmsFd || u.isDispatch,
  })
  async addNoteToItem(@BodyParams() body: unknown): Promise<APITypes.PostNotesData> {
    const data = validateSchema(NOTE_SCHEMA, body);

    const item = await this.findItem(data);
    const note = await prisma.note.create({
      data: {
        text: data.text,
        [data.type === "CITIZEN" ? "citizenId" : "vehicleId"]: item.id,
      },
    });

    return note;
  }

  @Put("/:id")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.EmsFd, Permissions.Dispatch],
    fallback: (u) => u.isLeo || u.isEmsFd || u.isDispatch,
  })
  async editNoteFromItem(
    @PathParams("id") noteId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutNotesData> {
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
  async deleteNoteFromItem(
    @PathParams("id") noteId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.DeleteNotesData> {
    const data = validateSchema(NOTE_SCHEMA, body);

    await this.findItem(data);

    await prisma.note.delete({ where: { id: noteId } });

    return true;
  }

  private getPrismaName(data: Zod.infer<typeof NOTE_SCHEMA>) {
    const prismaNames = {
      CITIZEN: "citizen",
      VEHICLE: "registeredVehicle",
    } as const;

    const name = prismaNames[data.type as keyof typeof prismaNames];
    return name;
  }

  private async findItem<T extends Citizen | RegisteredVehicle>(
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
