import { CREATE_COMPANY_POST_SCHEMA, DELETE_COMPANY_POST_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { validateBusinessAcceptance } from "utils/businesses";
import { validateSchema } from "lib/data/validate-schema";
import type { cad, User } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";

@UseGuards(AuthGuard)
@Controller("/businesses/posts")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessPostsController {
  @Post("/:id")
  async createPost(
    @Body() body: unknown,
    @SessionUser() user: User,
    @Cad() cad: cad,
    @Param("id") businessId: string,
  ): Promise<APITypes.PostBusinessPostsData> {
    const data = validateSchema(CREATE_COMPANY_POST_SCHEMA, body);

    await validateBusinessAcceptance(cad, businessId);

    const employee = await prisma.employee.findUnique({
      where: {
        id: data.employeeId,
      },
    });

    if (!employee || employee.userId !== user.id || employee.businessId !== businessId) {
      throw new NotFoundException("notFound");
    }

    if (!employee.canCreatePosts) {
      throw new ForbiddenException("insufficientPermissions");
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
    @Body() body: unknown,
    @SessionUser() user: User,
    @Cad() cad: cad,
    @Param("id") businessId: string,
    @Param("postId") postId: string,
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
      throw new NotFoundException("employeeNotFound");
    }

    if (!employee.canCreatePosts) {
      throw new ForbiddenException("insufficientPermissions");
    }

    const post = await prisma.businessPost.findFirst({
      where: {
        id: postId,
        businessId: employee.businessId,
        employeeId: data.employeeId,
      },
    });

    if (!post) {
      throw new NotFoundException("notFound");
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
    @Body() body: unknown,
    @SessionUser() user: User,
    @Cad() cad: cad,
    @Param("id") id: string,
    @Param("postId") postId: string,
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
      throw new NotFoundException("notFound");
    }

    await prisma.businessPost.delete({
      where: {
        id: postId,
      },
    });

    return true;
  }
}
