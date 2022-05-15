import { BodyParams, Controller, UseBeforeEach } from "@tsed/common";
import { IsAuth } from "middlewares/IsAuth";
import { Post } from "@tsed/schema";
import { validateSchema } from "lib/validateSchema";
import { NOTE_SCHEMA } from "@snailycad/schemas";

@Controller("/notes")
@UseBeforeEach(IsAuth)
export class NotesController {
  @Post("/")
  async addNoteToItem(@BodyParams() body: unknown) {
    const data = validateSchema(NOTE_SCHEMA, body);

    console.log({ data });
  }
}
