import { Controller } from "@tsed/di";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { Socket } from "services/socket-service";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { upsertOfficer } from "controllers/leo/my-officers/upsert-officer";
import type { cad, Feature, MiscCadSettings } from "@prisma/client";
import {
  CREATE_TEMPORARY_OFFICER_SCHEMA,
  CREATE_TEMPORARY_EMS_FD_DEPUTY_SCHEMA,
} from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { prisma } from "lib/data/prisma";
import { upsertEmsFdDeputy } from "lib/ems-fd/upsert-ems-fd-deputy";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { leoProperties, unitProperties } from "lib/leo/activeOfficer";

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
  async createTemporaryOfficer(
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<any> {
    const data = validateSchema(CREATE_TEMPORARY_OFFICER_SCHEMA, body);

    const existingOfficer = data.identifiers
      ? await prisma.officer.findFirst({
          where: {
            identifiers: { hasSome: data.identifiers },
          },
          include: leoProperties,
        })
      : null;

    const officer = await upsertOfficer({
      body,
      cad,
      schema: CREATE_TEMPORARY_OFFICER_SCHEMA,
      existingOfficer,
    });

    this.socket.emitUpdateOfficerStatus();

    const type = existingOfficer
      ? AuditLogActionType.TemporaryUnitUpdate
      : AuditLogActionType.TemporaryUnitCreate;

    await createAuditLogEntry({
      action: {
        type,
        previous: existingOfficer,
        new: officer,
      } as any,
      prisma,
      executorId: sessionUserId,
    });

    return officer;
  }

  @Post("/ems-fd")
  @Description(
    "Create a temporary EMS/FD deputy. It will update an existing deputy if the identifiers match.",
  )
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async createTemporaryEmsFdDeputy(
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<any> {
    const data = validateSchema(CREATE_TEMPORARY_EMS_FD_DEPUTY_SCHEMA, body);

    const existingDeputy = data.identifiers
      ? await prisma.emsFdDeputy.findFirst({
          where: {
            identifiers: { hasSome: data.identifiers },
          },
          include: unitProperties,
        })
      : null;

    const deputy = await upsertEmsFdDeputy({
      body,
      cad,
      schema: CREATE_TEMPORARY_EMS_FD_DEPUTY_SCHEMA,
      existingDeputy,
    });

    this.socket.emitUpdateDeputyStatus();

    const type = existingDeputy
      ? AuditLogActionType.TemporaryUnitUpdate
      : AuditLogActionType.TemporaryUnitCreate;

    await createAuditLogEntry({
      translationKey:
        type === AuditLogActionType.TemporaryUnitCreate ? "temporaryUnitCreate" : undefined,
      action: {
        type,
        previous: existingDeputy,
        new: deputy,
      } as any,
      prisma,
      executorId: sessionUserId,
    });

    return deputy;
  }
}
