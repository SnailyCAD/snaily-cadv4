import { PathParams, BodyParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Get, JsonRequestBody, Put } from "@tsed/schema";
import { unitProperties } from "../../../lib/officer";
import { prisma } from "../../../lib/prisma";
import { IsAuth, IsSupervisor } from "../../../middlewares";

const include = unitProperties;

@UseBeforeEach(IsAuth, IsSupervisor)
@Controller("/units")
export class ManageUnitsController {
  @Get("/")
  async getUnits() {
    const units = await Promise.all([
      (await prisma.officer.findMany({ include })).map((v) => ({ ...v, type: "OFFICER" })),
      (await prisma.emsFdDeputy.findMany({ include })).map((v) => ({ ...v, type: "DEPUTY" })),
    ]);

    return units.flat(1);
  }

  @Get("/:id")
  async getUnit(@PathParams("id") id: string) {
    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include: { ...include, logs: true },
    });

    if (!unit) {
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    return unit;
  }

  @Put("/:id")
  async updateUnit(@PathParams("id") id: string, @BodyParams() body: JsonRequestBody) {
    body;

    let type: "officer" | "emsFdDeputy" = "officer";
    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include,
    });

    if (!unit) {
      type = "emsFdDeputy";
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    // @ts-expect-error ignore
    const updated = await prisma[type].update({
      where: { id: unit.id },
      data: {
        statusId: body.get("status"),
        departmentId: body.get("department"),
        divisionId: body.get("division"),
        rankId: body.get("rank") || null,
      },
    });

    return updated;
  }
}
