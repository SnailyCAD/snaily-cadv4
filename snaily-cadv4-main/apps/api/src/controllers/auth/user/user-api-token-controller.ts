import { type ApiToken, type User } from "@snailycad/types";
import { BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { UseBefore } from "@tsed/platform-middlewares";
import { ContentType, Delete, Description, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { nanoid } from "nanoid";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "~/lib/data/validate-schema";
import { z } from "zod";

@Controller("/user/api-token")
@ContentType("application/json")
export class AccountController {
  @Put("/")
  @Description("Enable or disable the authenticated user's API Token.")
  @UseBefore(IsAuth)
  async enableDisableUserAPIToken(
    @Context("user") user: User & { apiToken?: ApiToken | null },
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
        token: `snp_${nanoid(56)}`,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        apiTokenId: apiToken.id,
      },
      select: { ...userProperties, apiToken: true },
    });

    return updatedUser;
  }

  @Post("/validate")
  @Description("Validate an API token")
  async validateApiToken(@BodyParams() body: unknown) {
    const schema = z.object({ token: z.string() });

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

    if (!dbToken || !user) {
      throw new BadRequest("invalidToken");
    }

    return { ...user, token: dbToken.token };
  }

  @Delete("/")
  @Description("Re-generate a token")
  @UseBefore(IsAuth)
  async generateNewApiToken(
    @Context("user") user: User,
  ): Promise<APITypes.DeleteUserRegenerateApiTokenData> {
    if (!user.apiTokenId) {
      throw new BadRequest("noApiTokenId");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        apiToken: { update: { token: `snp_${nanoid(56)}` } },
      },
      select: { ...userProperties, apiToken: true },
    });

    return updated;
  }
}
