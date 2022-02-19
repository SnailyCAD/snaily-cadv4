import { Controller } from "@tsed/di";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { CREATE_911_CALL, LINK_INCIDENT_TO_CALL } from "@snailycad/schemas";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/index";
import { ShouldDoType, CombinedLeoUnit, Officer, EmsFdDeputy } from ".prisma/client";
import { unitProperties, leoProperties } from "lib/officer";
import { validateSchema } from "lib/validateSchema";
import type { DepartmentValue, DivisionValue, User } from "@prisma/client";

const assignedUnitsInclude = {
  include: {
    officer: { include: leoProperties },
    deputy: { include: unitProperties },
    combinedUnit: {
      include: {
        status: { include: { value: true } },
        officers: {
          include: leoProperties,
        },
      },
    },
  },
};

export const callInclude = {
  position: true,
  assignedUnits: assignedUnitsInclude,
  events: true,
  incidents: true,
  departments: { include: leoProperties.department.include },
  divisions: { include: leoProperties.division.include },
  situationCode: { include: { value: true } },
};

@Controller("/911-calls")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async get911Calls(@QueryParams("includeEnded") includeEnded: boolean) {
    const calls = await prisma.call911.findMany({
      include: callInclude,
      orderBy: {
        createdAt: "desc",
      },
      where: includeEnded ? undefined : { ended: false },
    });

    return calls.map(this.officerOrDeputyToUnit);
  }

  @Post("/")
  async create911Call(@BodyParams() body: unknown, @Context("user") user: User) {
    const data = validateSchema(CREATE_911_CALL, body);

    const call = await prisma.call911.create({
      data: {
        location: data.location,
        postal: data.postal,
        description: data.description,
        descriptionData: data.descriptionData,
        name: data.name,
        userId: user.id || undefined,
        situationCodeId: data.situationCode ?? null,
      },
      include: callInclude,
    });

    const units = (data.assignedUnits ?? []) as string[];
    await this.assignUnitsToCall(call.id, units);
    await this.linkOrUnlinkCallDepartmentsAndDivisions({
      type: "connect",
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      callId: call.id,
    });

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emit911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Put("/:id")
  async update911Call(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context() ctx: Context,
  ) {
    const data = validateSchema(CREATE_911_CALL, body);

    const call = await prisma.call911.findUnique({
      where: {
        id,
      },
      include: {
        assignedUnits: assignedUnitsInclude,
        departments: true,
        divisions: true,
      },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    // reset assignedUnits. find a better way to do this?
    await Promise.all(
      call.assignedUnits.map(async ({ id }) => {
        await prisma.assignedUnit.delete({
          where: { id },
        });
      }),
    );

    await this.linkOrUnlinkCallDepartmentsAndDivisions({
      type: "disconnect",
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      callId: call.id,
    });

    const positionData = data.position ?? null;
    const shouldRemovePosition = data.position === null;

    const position = positionData
      ? await prisma.position.upsert({
          where: {
            id: call.positionId ?? "undefined",
          },
          create: {
            lat: positionData.lat ? parseFloat(positionData.lat) : 0.0,
            lng: positionData.lng ? parseFloat(positionData.lng) : 0.0,
          },
          update: {
            lat: positionData.lat ? parseFloat(positionData.lat) : 0.0,
            lng: positionData.lng ? parseFloat(positionData.lng) : 0.0,
          },
        })
      : null;

    await prisma.call911.update({
      where: {
        id: call.id,
      },
      data: {
        location: data.location,
        postal: String(data.postal),
        description: data.description,
        name: data.name,
        userId: ctx.get("user").id,
        positionId: shouldRemovePosition ? null : position?.id ?? call.positionId,
        descriptionData: data.descriptionData,
        situationCodeId: data.situationCode === null ? null : data.situationCode,
      },
    });

    const units = (data.assignedUnits ?? []) as string[];
    await this.assignUnitsToCall(call.id, units);
    await this.linkOrUnlinkCallDepartmentsAndDivisions({
      type: "connect",
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      callId: call.id,
    });

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Delete("/purge")
  async purgeCalls(@BodyParams("ids") ids: string[]) {
    if (!Array.isArray(ids)) return;

    await Promise.all(
      ids.map(async (id) => {
        const call = await prisma.call911.delete({
          where: { id },
        });

        this.socket.emit911CallDelete(call);
      }),
    );

    return true;
  }

  @Delete("/:id")
  async end911Call(@PathParams("id") id: string) {
    const call = await prisma.call911.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    await prisma.call911.update({
      where: {
        id: call.id,
      },
      data: {
        ended: true,
      },
    });

    this.socket.emit911CallDelete(call);

    return true;
  }

  @Post("/:type/:callId")
  async assignToCall(
    @PathParams("type") callType: "assign" | "unassign",
    @PathParams("callId") callId: string,
    @BodyParams() body: any,
  ) {
    const { unit: rawUnit } = body;

    if (!rawUnit) {
      throw new BadRequest("unitIsRequired");
    }

    const { unit, type } = await findUnit(rawUnit, undefined, true);
    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const existing = await prisma.assignedUnit.findFirst({
      where: {
        call911Id: callId,
        [type === "leo" ? "officerId" : "emsFdDeputyId"]: unit.id,
      },
    });

    if (callType === "assign") {
      if (existing) {
        throw new BadRequest("alreadyAssignedToCall");
      }

      await prisma.assignedUnit.create({
        data: {
          call911Id: callId,
          [type === "leo" ? "officerId" : "emsFdDeputyId"]: unit.id,
        },
      });
    } else {
      if (!existing) {
        throw new BadRequest("notAssignedToCall");
      }

      await prisma.assignedUnit.delete({
        where: { id: existing.id },
      });
    }

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Post("/link-incident/:callId")
  async linkCallToIncident(@PathParams("callId") callId: string, @BodyParams() body: unknown) {
    const data = validateSchema(LINK_INCIDENT_TO_CALL, body);
    const incidentId = data.incidentId;

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFound("incidentNotFound");
    }

    await prisma.leoIncident.update({
      where: { id: incident.id },
      data: { calls: { connect: { id: call.id } } },
    });

    return true;
  }

  protected officerOrDeputyToUnit(call: any & { assignedUnits: any[] }) {
    return {
      ...call,
      assignedUnits: (call.assignedUnits ?? [])
        ?.map((v: any) => ({
          ...v,
          officer: undefined,
          deputy: undefined,

          unit: v.officer ?? v.deputy ?? v.combinedUnit,
        }))
        .filter((v: any) => v.unit?.id),
    };
  }

  protected async linkOrUnlinkCallDepartmentsAndDivisions({
    type,
    callId,
    departments,
    divisions,
  }: {
    type: "disconnect" | "connect";
    callId: string;
    departments: (DepartmentValue["id"] | DepartmentValue)[];
    divisions: (DivisionValue["id"] | DivisionValue)[];
  }) {
    await Promise.all(
      departments.map(async (dep) => {
        const id = typeof dep === "string" ? dep : dep.id;
        await prisma.call911.update({
          where: { id: callId },
          data: { departments: { [type]: { id } } },
        });
      }),
    );

    await Promise.all(
      divisions.map(async (division) => {
        const id = typeof division === "string" ? division : division.id;
        await prisma.call911.update({
          where: { id: callId },
          data: { divisions: { [type]: { id } } },
        });
      }),
    );
  }

  protected async assignUnitsToCall(callId: string, units: string[]) {
    await Promise.all(
      units.map(async (id) => {
        const { unit, type } = await findUnit(
          id,
          {
            NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          },
          true,
        );

        if (!unit) {
          throw new BadRequest("unitOffDuty");
        }

        const types = {
          combined: "combinedLeoId",
          leo: "officerId",
          "ems-fd": "emsFdDeputyId",
        };

        const status = await prisma.statusValue.findFirst({
          where: { shouldDo: "SET_ASSIGNED" },
        });

        if (status) {
          const t =
            type === "leo" ? "officer" : type === "ems-fd" ? "emsFdDeputy" : "combinedLeoUnit";
          // @ts-expect-error ignore
          await prisma[t].update({
            where: { id: unit.id },
            data: { statusId: status.id },
          });

          this.socket.emitUpdateOfficerStatus();
          this.socket.emitUpdateDeputyStatus();
        }

        const assignedUnit = await prisma.assignedUnit.create({
          data: {
            call911Id: callId,
            [types[type]]: unit.id,
          },
        });

        await prisma.call911.update({
          where: {
            id: callId,
          },
          data: {
            assignedUnits: {
              connect: { id: assignedUnit.id },
            },
          },
        });
      }),
    );
  }
}

export async function findUnit(
  id: string,
  extraFind?: any,
  searchCombined?: false,
): Promise<{ unit: Officer | EmsFdDeputy | null; type: "leo" | "ems-fd" }>;
export async function findUnit(
  id: string,
  extraFind?: any,
  searchCombined?: true,
): Promise<{
  unit: Officer | EmsFdDeputy | CombinedLeoUnit | null;
  type: "leo" | "ems-fd" | "combined";
}>;
export async function findUnit(id: string, extraFind?: any, searchCombined?: boolean) {
  let type: "leo" | "ems-fd" = "leo";
  let unit: any = await prisma.officer.findFirst({
    where: { id, ...extraFind },
  });

  if (!unit) {
    type = "ems-fd";
    unit = await prisma.emsFdDeputy.findFirst({ where: { id, ...extraFind } });
  }

  if (searchCombined && !unit) {
    unit = await prisma.combinedLeoUnit.findFirst({
      where: {
        id,
      },
      include: {
        officers: { include: leoProperties },
      },
    });

    return { type: "combined", unit: unit ?? null };
  }

  return { type, unit: unit ?? null };
}
