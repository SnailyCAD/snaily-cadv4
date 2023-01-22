import { Controller } from "@tsed/di";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { Socket } from "services/socket-service";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { createOfficer } from "controllers/leo/my-officers/create-officer";
import type { cad, CadFeature, MiscCadSettings } from "@prisma/client";

@Controller("/temporary-units")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class TemporaryUnitsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Post("/")
  @Description("Create a temporary unit.")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async createTemporaryUnit(
    @Context("cad") cad: cad & { features: CadFeature[]; miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ): Promise<any> {
    const officer = await createOfficer({
      body,
      cad,
    });
  }
}
