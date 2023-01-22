import { Controller } from "@tsed/di";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { Socket } from "services/socket-service";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { upsertOfficer } from "controllers/leo/my-officers/upsert-officer";
import type { cad, CadFeature, MiscCadSettings } from "@prisma/client";
import { CREATE_TEMPORARY_UNIT_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { prisma } from "lib/data/prisma";

@Controller("/temporary-units")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class TemporaryUnitsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/officer")
  @Description(
    "Create a temporary officer. It will update an existing officer if the identifiers match.",
  )
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async createTemporaryUnit(
    @Context("cad") cad: cad & { features: CadFeature[]; miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ): Promise<any> {
    const data = validateSchema(CREATE_TEMPORARY_UNIT_SCHEMA, body);

    const existingOfficer = data.identifiers
      ? await prisma.officer.findFirst({
          where: {
            identifiers: { hasSome: data.identifiers },
          },
          include: {
            whitelistStatus: true,
            divisions: true,
          },
        })
      : null;

    const officer = await upsertOfficer({
      body,
      cad,
      schema: CREATE_TEMPORARY_UNIT_SCHEMA,
      existingOfficer,
    });

    this.socket.emitUpdateOfficerStatus();

    return officer;
  }
}
