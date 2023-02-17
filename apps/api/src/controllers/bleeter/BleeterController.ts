import fs from "node:fs/promises";
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
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { validateSchema } from "lib/data/validate-schema";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import type { User } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { getImageWebPPath } from "lib/images/get-image-webp-path";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";

@UseBeforeEach(IsAuth)
@Controller("/bleeter")
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BLEETER })
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
      include: { user: { select: { username: true } } },
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
      include: { user: { select: { username: true } } },
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
    try {
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

      const image = await getImageWebPPath({
        buffer: file.buffer,
        pathType: "bleeter",
        id: `${post.id}-${file.originalname.split(".")[0]}`,
      });

      const [data] = await Promise.all([
        prisma.bleeterPost.update({
          where: { id: post.id },
          data: { imageId: image.fileName, imageBlurData: await generateBlurPlaceholder(image) },
          select: { imageId: true },
        }),
        fs.writeFile(image.path, image.buffer),
      ]);

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
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
