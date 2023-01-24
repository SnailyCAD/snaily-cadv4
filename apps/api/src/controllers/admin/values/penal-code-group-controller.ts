import { BodyParams, Controller, PathParams, QueryParams, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/is-auth";
import { CREATE_PENAL_CODE_GROUP_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { Rank } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";

@Controller("/admin/penal-code-group")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class PenalCodeGroupController {
  @Get("/")
  async getPenalCodeGroups(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetPenalCodeGroupsData> {
    const where = query ? ({ name: { contains: query, mode: "insensitive" } } as const) : undefined;

    const [totalCount, penalCodeGroups] = await prisma.$transaction([
      prisma.penalCodeGroup.count({ where, orderBy: { position: "asc" } }),
      prisma.penalCodeGroup.findMany({
        where,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        orderBy: { position: "asc" },
      }),
    ]);

    return { totalCount, groups: penalCodeGroups };
  }

  @Post("/")
  @Description("Create a new penal-code group")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageValuePenalCode],
  })
  async createPenalCodeGroup(
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostPenalCodeGroupsData> {
    const data = validateSchema(CREATE_PENAL_CODE_GROUP_SCHEMA, body);

    const group = await prisma.penalCodeGroup.create({
      data: {
        name: data.name,
      },
    });

    return group;
  }

  @Put("/:id")
  @Description("Edit a penal-code group by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageValuePenalCode],
  })
  async editPenalCodeGroup(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutPenalCodeGroupsData> {
    const data = validateSchema(CREATE_PENAL_CODE_GROUP_SCHEMA, body);

    const group = await prisma.penalCodeGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.penalCodeGroup.update({
      where: { id },
      data: { name: data.name },
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a penal-code group by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageValuePenalCode],
  })
  async deletePenalCodeGroup(
    @PathParams("id") id: string,
  ): Promise<APITypes.DeletePenalCodeGroupsData> {
    const group = await prisma.penalCodeGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFound("notFound");
    }

    const deleted = await prisma.penalCodeGroup.delete({
      where: { id },
    });

    return !!deleted;
  }
}
