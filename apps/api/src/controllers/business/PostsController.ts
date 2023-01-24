import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Delete, Hidden, Post, Put } from "@tsed/schema";
import { IsAuth } from "middlewares/is-auth";
import { CREATE_COMPANY_POST_SCHEMA, DELETE_COMPANY_POST_SCHEMA } from "@snailycad/schemas";
import { Forbidden, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { validateBusinessAcceptance } from "utils/businesses";
import { validateSchema } from "lib/data/validate-schema";
import type { cad, User } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";

@UseBeforeEach(IsAuth)
@Controller("/businesses/posts")
@Hidden()
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessPostsController {
  @Post("/:id")
  async createPost(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @PathParams("id") businessId: string,
  ): Promise<APITypes.PostBusinessPostsData> {
    const data = validateSchema(CREATE_COMPANY_POST_SCHEMA, body);

    await validateBusinessAcceptance(cad, businessId);

    const employee = await prisma.employee.findUnique({
      where: {
        id: data.employeeId,
      },
    });

    if (!employee || employee.userId !== user.id || employee.businessId !== businessId) {
      throw new NotFound("notFound");
    }

    if (!employee.canCreatePosts) {
      throw new Forbidden("insufficientPermissions");
    }

    const post = await prisma.businessPost.create({
      data: {
        body: data.body,
        bodyData: data.bodyData,
        title: data.title,
        businessId,
        employeeId: employee.id,
        userId: user.id,
      },
    });

    return post;
  }

  @Put("/:id/:postId")
  async updatePost(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @PathParams("id") businessId: string,
    @PathParams("postId") postId: string,
  ): Promise<APITypes.PutBusinessPostsData> {
    const data = validateSchema(CREATE_COMPANY_POST_SCHEMA, body);

    await validateBusinessAcceptance(cad, businessId);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        userId: user.id,
        businessId,
      },
    });

    if (!employee) {
      throw new NotFound("employeeNotFound");
    }

    if (!employee.canCreatePosts) {
      throw new Forbidden("insufficientPermissions");
    }

    const post = await prisma.businessPost.findFirst({
      where: {
        id: postId,
        businessId: employee.businessId,
        employeeId: data.employeeId,
      },
    });

    if (!post) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.businessPost.update({
      where: {
        id: postId,
      },
      data: {
        body: data.body,
        bodyData: data.bodyData,
        title: data.title,
      },
    });

    return updated;
  }

  @Delete("/:id/:postId")
  async deletePost(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @PathParams("id") id: string,
    @PathParams("postId") postId: string,
  ): Promise<APITypes.DeleteBusinessPostsData> {
    const data = validateSchema(DELETE_COMPANY_POST_SCHEMA, body);

    await validateBusinessAcceptance(cad, id);

    const post = await prisma.businessPost.findFirst({
      where: {
        id: postId,
        businessId: id,
        userId: user.id,
        employeeId: data.employeeId,
      },
    });

    if (!post) {
      throw new NotFound("notFound");
    }

    await prisma.businessPost.delete({
      where: {
        id: postId,
      },
    });

    return true;
  }
}
