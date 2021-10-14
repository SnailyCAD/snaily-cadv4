import { ValueType } from ".prisma/client";
import { validate, VALUE_SCHEMA } from "@snailycad/schemas";
import {
  Get,
  Controller,
  PathParams,
  UseBeforeEach,
  UseBefore,
  BodyParams,
  QueryParams,
} from "@tsed/common";
import { Delete, JsonRequestBody, Patch, Post } from "@tsed/schema";
import { ValidPath } from "@snailycad/config";
import { prisma } from "../../lib/prisma";
import { IsAdmin } from "../../middlewares/Permissions";
import { IsValidPath } from "../../middlewares/ValidPath";
import { BadRequest } from "@tsed/exceptions";

@Controller("/admin/values/:path")
@UseBeforeEach(IsValidPath)
export class ValuesController {
  @Get("/")
  async getValueByPath(
    @PathParams("path") path: ValidPath,
    @QueryParams("paths") rawPaths: string,
  ) {
    // allow more paths in one request
    const paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    const values = await Promise.all(
      paths.map(async (path) => {
        const type = this.getTypeFromPath(path as ValidPath);

        if (type === "BUSINESS_ROLE") {
          return {
            type,
            values: await prisma.employeeValue.findMany({
              include: {
                value: true,
              },
            }),
          };
        }

        return {
          type,
          values: await prisma.value.findMany({
            where: {
              type,
            },
          }),
        };
      }),
    );

    return values;
  }

  @UseBefore(IsAdmin)
  @Post("/")
  async createValueByPath(
    @BodyParams() body: JsonRequestBody,
    @PathParams("path") path: ValidPath,
  ) {
    const type = this.getTypeFromPath(path);
    const error = validate(VALUE_SCHEMA, body.toJSON(), true);

    if (error) {
      return { error };
    }

    const value = await prisma.value.create({
      data: {
        type,
        value: body.get("value"),
        isDefault: false,
      },
    });

    if (type === "BUSINESS_ROLE") {
      if (!body.get("as")) {
        throw new BadRequest("asRequired");
      }

      await prisma.employeeValue.create({
        data: {
          as: body.get("as"),
          valueId: value.id,
        },
      });
    }

    return value;
  }

  @UseBefore(IsAdmin)
  @Delete("/:id")
  async deleteValueByPathAndId(@PathParams("id") id: string) {
    await prisma.value.delete({
      where: {
        id,
      },
    });

    return true;
  }

  @UseBefore(IsAdmin)
  @Patch("/:id")
  async patchValueByPathAndId(@BodyParams() body: JsonRequestBody, @PathParams("id") id: string) {
    const error = validate(VALUE_SCHEMA, body.toJSON(), true);

    if (error) {
      return { error };
    }

    const updated = await prisma.value.update({
      where: {
        id,
      },
      data: {
        value: body.get("value"),
      },
    });

    return updated;
  }

  private getTypeFromPath(path: ValidPath): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
  }
}
