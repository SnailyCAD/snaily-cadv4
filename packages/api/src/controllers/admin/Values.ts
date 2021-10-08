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
import { JsonRequestBody, Post } from "@tsed/schema";
import { ValidPath } from "@snailycad/config";
import { prisma } from "../../lib/prisma";
import { IsAdmin } from "../../middlewares/Permissions";
import { IsValidPath } from "../../middlewares/ValidPath";

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

    return value;
  }

  private getTypeFromPath(path: ValidPath): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
  }
}
