import fs from "node:fs";
import process from "node:process";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { BLEETER_SCHEMA } from "@snailycad/schemas";
import {
  Controller,
  Get,
  UseBeforeEach,
  PathParams,
  Post,
  BodyParams,
  Context,
  PlatformMulterFile,
  MultipartFile,
} from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { Delete, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

@UseBeforeEach(IsAuth)
@Controller("/bleeter")
export class BleeterController {
  @Get("/")
  async getBleeterPosts() {
    const posts = await prisma.bleeterPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    return posts;
  }

  @Get("/:id")
  async getPostById(@PathParams("id") postId: string) {
    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFound("notFound");
    }

    return post;
  }

  @Post("/")
  async createPost(@BodyParams() body: unknown, @Context() ctx: Context) {
    const data = validateSchema(BLEETER_SCHEMA, body);

    const post = await prisma.bleeterPost.create({
      data: {
        title: data.title,
        body: data.body,
        bodyData: data.bodyData,
        userId: ctx.get("user").id,
      },
    });

    return post;
  }

  @Put("/:id")
  async updatePost(
    @PathParams("id") postId: string,
    @BodyParams() body: unknown,
    @Context() ctx: Context,
  ) {
    const data = validateSchema(BLEETER_SCHEMA, body);

    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.bleeterPost.update({
      where: {
        id: post.id,
      },
      data: {
        title: data.title,
        body: data.body,
        bodyData: data.bodyData,
      },
    });

    return updated;
  }

  @Post("/:id")
  async uploadImageToPost(
    @Context() ctx: Context,
    @PathParams("id") postId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" });
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/bleeter/${post.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.bleeterPost.update({
      where: {
        id: postId,
      },
      data: {
        imageId: `${post.id}.${extension}`,
      },
      select: {
        imageId: true,
      },
    });

    return data;
  }

  @Delete("/:id")
  async deleteBleetPost(@PathParams("id") postId: string, @Context() ctx: Context) {
    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    await prisma.bleeterPost.delete({
      where: {
        id: post.id,
      },
    });

    return true;
  }
}
