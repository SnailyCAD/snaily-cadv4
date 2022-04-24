import type { ApiToken, User } from "@prisma/client";
import { BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { UseBefore } from "@tsed/platform-middlewares";
import { Delete, Description, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { nanoid } from "nanoid";

@Controller("/user/api-token")
@UseBefore(IsAuth)
export class AccountController {
  @Put("/")
  @Description("Enable or disable the authenticated user's API Token.")
  @UsePermissions({
    fallback: false,
    permissions: [Permissions.UsePersonalApiToken],
  })
  async enableDisableUserAPIToken(
    @Context("user") user: User & { apiToken?: ApiToken | null },
    @BodyParams() body: any,
  ) {
    if (body.enabled === false) {
      user.apiTokenId &&
        (await prisma.apiToken.delete({
          where: {
            id: user.apiTokenId,
          },
        }));

      return { enabled: false, token: "" };
    }

    if (user.apiToken) {
      return user;
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        enabled: true,
        token: nanoid(56),
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        apiTokenId: apiToken.id,
      },
      select: userProperties,
    });

    return updatedUser;
  }

  @Delete("/")
  @Description("Re-generate a token")
  @UsePermissions({
    fallback: false,
    permissions: [Permissions.UsePersonalApiToken],
  })
  async generateNewApiToken(@Context("user") user: User & { apiToken?: ApiToken | null }) {
    if (!user.apiTokenId) {
      throw new BadRequest("noApiTokenId");
    }

    const updated = await prisma.apiToken.update({
      where: {
        id: user.apiTokenId,
      },
      data: {
        token: nanoid(56),
      },
    });

    return updated;
  }
}
