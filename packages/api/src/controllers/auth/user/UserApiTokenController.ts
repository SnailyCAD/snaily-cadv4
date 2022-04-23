import type { ApiToken, User } from "@prisma/client";
import { BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBefore } from "@tsed/platform-middlewares";
import { Delete, Description, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { nanoid } from "nanoid";

@Controller("/user/api-token")
@UseBefore(IsAuth)
export class AccountController {
  @Put("/")
  @Description("Enable or disable the authenticated user's API Token.")
  async enableDisableUserAPIToken(
    @Context("user") user: User & { apiToken?: ApiToken | null },
    @BodyParams("body") body: any,
  ) {
    const existing =
      user.apiTokenId &&
      (await prisma.apiToken.findFirst({
        where: {
          id: user.apiTokenId,
        },
      }));

    if (existing && body.enabled === true) {
      const updated = await prisma.apiToken.update({
        where: {
          id: existing.id,
        },
        data: {
          enabled: body.enabled,
        },
      });

      return updated;
    }

    if (body.enabled === false) {
      user.apiTokenId &&
        (await prisma.apiToken.delete({
          where: {
            id: user.apiTokenId,
          },
        }));

      return { enabled: false, token: "" };
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        user: { connect: { id: user.id } },
        enabled: true,
        token: nanoid(56),
      },
    });

    return apiToken;
  }

  @Delete("/")
  @Description("Re-generate a token")
  async generateNewApiToken() {}
}
