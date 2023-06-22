import { Feature, User } from "@snailycad/types";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { nanoid } from "nanoid";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { BadRequestException, Body, Controller, Delete, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";

@Controller("/user/api-token")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.USER_API_TOKENS })
export class UserApiTokenController {
  @Put("/")
  @Description("Enable or disable the authenticated user's API Token.")
  @UsePermissions({
    permissions: [Permissions.UsePersonalApiToken],
  })
  async enableDisableUserAPIToken(
    @SessionUser() user: User,
    @Body() body: any,
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

  @Delete("/")
  @Description("Re-generate a token")
  @UsePermissions({
    permissions: [Permissions.UsePersonalApiToken],
  })
  async generateNewApiToken(
    @SessionUser() user: User,
  ): Promise<APITypes.DeleteUserRegenerateApiTokenData> {
    if (!user.apiTokenId) {
      throw new BadRequestException("noApiTokenId");
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
