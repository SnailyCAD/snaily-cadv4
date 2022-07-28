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
import { Delete, Description, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import type { User } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";

@UseBeforeEach(IsAuth)
@Controller("/bleeter")
export class BleeterController {
  @Get("/")
  @Description("Get **all** bleeter posts, ordered by `createdAt`")
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
  @Description("Get a bleeter post by its id")
  async getPostById(@PathParams("id") postId: string): Promise<APITypes.GetBleeterByIdData> {
    const post = await prisma.bleeterPost.findUnique({
      where: { id: postId },
      include: { user: { select: { username: true } } },
    });

    if (!post) {
      throw new NotFound("notFound");
    }

    return post;
  }

  @Post("/")
  @Description("Create a bleeter post")
  async createPost(
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostBleeterByIdData> {
    const data = validateSchema(BLEETER_SCHEMA, body);

    const post = await prisma.bleeterPost.create({
      data: {
        title: data.title,
        body: data.body,
        bodyData: data.bodyData,
        userId: user.id,
      },
    });

    return post;
  }

  @Put("/:id")
  @Description("Update a bleeter post by its id")
  async updatePost(
    @PathParams("id") postId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PutBleeterByIdData> {
    const data = validateSchema(BLEETER_SCHEMA, body);

    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.userId !== user.id) {
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
  @Description("Upload a header image to an already created bleeter post")
  async uploadImageToPost(
    @Context("user") user: User,
    @PathParams("id") postId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostBleeterByIdImageData> {
    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

    if (!post || post.userId !== user.id) {
      throw new NotFound("notFound");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" });
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/bleeter/${post.id}.${extension}`;

    const [data] = await Promise.all([
      prisma.bleeterPost.update({
        where: { id: post.id },
        data: { imageId: `${post.id}.${extension}` },
        select: { imageId: true },
      }),
      fs.writeFileSync(path, file.buffer),
    ]);

    return data;
  }

  @Delete("/:id")
  @Description("Delete a bleeter post its id")
  async deleteBleetPost(
    @PathParams("id") postId: string,
    @Context("user") user: User,
  ): Promise<APITypes.DeleteBleeterByIdData> {
    const post = await prisma.bleeterPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.userId !== user.id) {
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
