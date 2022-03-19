import { BodyParams, Controller, PathParams, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/IsAuth";
import { CREATE_PENAL_CODE_GROUP_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { Rank } from "@prisma/client";

@Controller("/admin/penal-code-group")
@UseBeforeEach(IsAuth)
export class ValuesController {
  @Post("/")
  @Description("Create a new penal-code group")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.OWNER,
    permissions: [Permissions.ManageValuePenalCode],
  })
  async createPenalCodeGroup(@BodyParams() body: unknown) {
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
    fallback: (u) => u.rank !== Rank.OWNER,
    permissions: [Permissions.ManageValuePenalCode],
  })
  async editPenalCodeGroup(@PathParams("id") id: string, @BodyParams() body: unknown) {
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
    fallback: (u) => u.rank !== Rank.OWNER,
    permissions: [Permissions.ManageValuePenalCode],
  })
  async deletePenalCodeGroup(@PathParams("id") id: string) {
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
