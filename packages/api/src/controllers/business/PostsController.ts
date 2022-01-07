import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, JsonRequestBody, Post, Put } from "@tsed/schema";
import { IsAuth } from "middlewares/index";
import {
  CREATE_COMPANY_POST_SCHEMA,
  DELETE_COMPANY_POST_SCHEMA,
  validate,
} from "@snailycad/schemas";
import { BadRequest, Forbidden, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { validateBusinessAcceptance } from "utils/businesses";

@UseBeforeEach(IsAuth)
@Controller("/businesses/posts")
export class BusinessPostsController {
  @Post("/:id")
  async createPost(
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
    @PathParams("id") businessId: string,
  ) {
    const error = validate(CREATE_COMPANY_POST_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    await validateBusinessAcceptance(ctx, businessId);

    const employee = await prisma.employee.findUnique({
      where: {
        id: body.get("employeeId"),
      },
    });

    if (!employee || employee.userId !== ctx.get("user").id || employee.businessId !== businessId) {
      throw new NotFound("notFound");
    }

    if (!employee.canCreatePosts) {
      throw new Forbidden("insufficientPermissions");
    }

    const post = await prisma.businessPost.create({
      data: {
        body: body.get("body"),
        title: body.get("title"),
        businessId,
        employeeId: employee.id,
        userId: ctx.get("user").id,
      },
    });

    return post;
  }

  @Put("/:id/:postId")
  async updatePost(
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
    @PathParams("id") businessId: string,
    @PathParams("postId") postId: string,
  ) {
    const error = validate(CREATE_COMPANY_POST_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    await validateBusinessAcceptance(ctx, businessId);

    const employee = await prisma.employee.findFirst({
      where: {
        id: body.get("employeeId"),
        userId: ctx.get("user").id,
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
        employeeId: body.get("employeeId"),
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
        body: body.get("body"),
        title: body.get("title"),
      },
    });

    return updated;
  }

  @Delete("/:id/:postId")
  async deletePost(
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
    @PathParams("id") id: string,
    @PathParams("postId") postId: string,
  ) {
    const error = validate(DELETE_COMPANY_POST_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    await validateBusinessAcceptance(ctx, id);

    const post = await prisma.businessPost.findFirst({
      where: {
        id: postId,
        businessId: id,
        userId: ctx.get("user").id,
        employeeId: body.get("employeeId"),
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
