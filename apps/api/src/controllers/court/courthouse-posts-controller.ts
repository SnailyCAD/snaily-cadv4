import { Feature, Rank, User } from "@prisma/client";
import {
  BodyParams,
  Context,
  Controller,
  PathParams,
  QueryParams,
  UseBeforeEach,
} from "@tsed/common";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { COURTHOUSE_POST_SCHEMA } from "@snailycad/schemas";
import { userProperties } from "lib/auth/getSessionUser";
import { NotFound } from "@tsed/exceptions";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/courthouse-posts")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.COURTHOUSE_POSTS })
export class CourthousePostsController {
  @Get("/")
  async getCourthousePosts(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetCourthousePostsData> {
    const [totalCount, courthousePosts] = await prisma.$transaction([
      prisma.courthousePost.count(),
      prisma.courthousePost.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: userProperties } },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { totalCount, courthousePosts };
  }

  @UsePermissions({
    fallback: (user) => user.rank !== Rank.USER,
    permissions: [Permissions.ManageCourthousePosts],
  })
  @Post("/")
  async createCourthousePost(
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostCourthousePostsData> {
    const data = validateSchema(COURTHOUSE_POST_SCHEMA, body);

    const post = await prisma.courthousePost.create({
      data: {
        title: data.title,
        descriptionData: data.descriptionData,
        userId: user.id,
      },
      include: { user: { select: userProperties } },
    });

    return post;
  }

  @UsePermissions({
    fallback: (user) => user.rank !== Rank.USER,
    permissions: [Permissions.ManageCourthousePosts],
  })
  @Put("/:id")
  async updateCourthousePost(
    @PathParams("id") postId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCourthousePostsData> {
    const data = validateSchema(COURTHOUSE_POST_SCHEMA, body);

    const post = await prisma.courthousePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFound("Post not found");
    }

    const updated = await prisma.courthousePost.update({
      where: { id: post.id },
      data: {
        title: data.title,
        descriptionData: data.descriptionData,
      },
      include: { user: { select: userProperties } },
    });

    return updated;
  }

  @UsePermissions({
    fallback: (user) => user.rank !== Rank.USER,
    permissions: [Permissions.ManageCourthousePosts],
  })
  @Delete("/:id")
  async deleteCourthousePost(
    @PathParams("id") postId: string,
  ): Promise<APITypes.DeleteCourthousePostsData> {
    const post = await prisma.courthousePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFound("Post not found");
    }

    await prisma.courthousePost.delete({
      where: { id: post.id },
    });

    return true;
  }
}
