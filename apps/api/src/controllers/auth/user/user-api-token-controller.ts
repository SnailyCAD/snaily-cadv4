import { Feature, User } from "@snailycad/types";
import { BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { UseBefore } from "@tsed/platform-middlewares";
import { ContentType, Delete, Description, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { nanoid } from "nanoid";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { z } from "zod";
import { validateSchema } from "~/lib/data/validate-schema";

@Controller("/user/api-token")
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.USER_API_TOKENS })
export class AccountController {
  @Put("/")
  @Description("Enable or disable the authenticated user's API Token.")
  @UsePermissions({
    permissions: [Permissions.UsePersonalApiToken],
  })
  @UseBefore(IsAuth)
  async enableDisableUserAPIToken(
    @Context("user") user: User,
    @BodyParams() body: any,
  ): Promise<APITypes.PutUserEnableDisableApiTokenData> {
    if (body.enabled === false) {
      if (!user.apiTokenId) {
        return { ...user, apiToken: null, apiTokenId: null };
      }

      await prisma.apiToken.delete({ where: { id: user.apiTokenId } });

      return { ...user, apiToken: null, apiTokenId: null };
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

  @Post("/validate")
  @Description("Validate an API token")
  async validateApiToken(@BodyParams() body: unknown) {
    const schema = z.object({
      identifiers: z.array(z.string()),
      token: z.string(),
    });

    const data = validateSchema(schema, body);

    const dbToken = await prisma.apiToken.findFirst({
      where: { token: data.token },
      include: {
        User: {
          select: {
            username: true,
            id: true,
            steamId: true,
            discordId: true,
            permissions: true,
          },
        },
      },
    });

    const user = dbToken?.User[0];

    // todo: validate identifiers

    if (!dbToken || !user) {
      throw new BadRequest("invalidToken");
    }

    return { ...user, token: dbToken.token };
  }

  @Delete("/")
  @Description("Re-generate a token")
  @UseBefore(IsAuth)
  @UsePermissions({
    permissions: [Permissions.UsePersonalApiToken],
  })
  async generateNewApiToken(
    @Context("user") user: User,
  ): Promise<APITypes.DeleteUserRegenerateApiTokenData> {
    if (!user.apiTokenId) {
      throw new BadRequest("noApiTokenId");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        apiToken: { update: { token: nanoid(56) } },
      },
      select: userProperties,
    });

    return updated;
  }
}
