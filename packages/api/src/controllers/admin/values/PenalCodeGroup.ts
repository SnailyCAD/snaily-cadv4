import { BodyParams, Controller, PathParams, UseBeforeEach } from "@tsed/common";
import { Delete, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";
import { validate, CREATE_PENAL_CODE_GROUP_SCHEMA } from "@snailycad/schemas";

@Controller("/admin/penal-code-group")
@UseBeforeEach(IsAuth)
export class ValuesController {
  @Post("/")
  async createPenalCodeGroup(@BodyParams() body: JsonRequestBody) {
    const error = validate(CREATE_PENAL_CODE_GROUP_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const group = await prisma.penalCodeGroup.create({
      data: {
        name: body.get("name"),
      },
    });

    return group;
  }

  @Put("/:id")
  async editPenalCodeGroup(@PathParams("id") id: string, @BodyParams() body: JsonRequestBody) {
    const error = validate(CREATE_PENAL_CODE_GROUP_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const group = await prisma.penalCodeGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.penalCodeGroup.update({
      where: { id },
      data: { name: body.get("name") },
    });

    return updated;
  }

  @Delete("/:id")
  async deletePenalCodeGroup(@PathParams("id") id: string) {
    const group = await prisma.penalCodeGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.penalCodeGroup.delete({
      where: { id },
    });

    return !!updated;
  }
}
