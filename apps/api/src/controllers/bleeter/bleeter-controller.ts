import fs from "node:fs/promises";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { BLEETER_PROFILE_SCHEMA, BLEETER_SCHEMA } from "@snailycad/schemas";
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
import { IsAuth } from "middlewares/auth/is-auth";
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
  async getBleeterPosts(@Context("user") user: User) {
    const [posts, totalCount] = await prisma.$transaction([
      prisma.bleeterPost.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { username: true } },
          creator: true,
        },
      }),
      prisma.bleeterPost.count(),
    ]);

    const userBleeterProfile = await prisma.bleeterProfile.findUnique({
      where: { userId: user.id },
    });

    return { posts, totalCount, userBleeterProfile };
  }

  @Get("/:id")
  @Description("Get a bleeter post by its id")
  async getPostById(@PathParams("id") postId: string): Promise<APITypes.GetBleeterByIdData> {
    const post = await prisma.bleeterPost.findUnique({
      where: { id: postId },
      include: {
        user: { select: { username: true } },
        creator: true,
      },
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
  ): Promise<APITypes.PostBleeterData> {
    const data = validateSchema(BLEETER_SCHEMA, body);

    const userProfile = await prisma.bleeterProfile.findUnique({
      where: { userId: user.id },
    });

    const post = await prisma.bleeterPost.create({
      data: {
        title: data.title,
        body: data.body,
        bodyData: data.bodyData,
        userId: user.id,
        creatorId: userProfile?.id,
      },
      include: {
        user: { select: { username: true } },
        creator: true,
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
      include: {
        user: { select: { username: true } },
        creator: true,
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

  @Post("/new-experience/profile")
  @Description("Create a new bleeter profile")
  async createBleeterProfile(
    @Context("user") user: User,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostNewExperienceProfileData> {
    const data = validateSchema(BLEETER_PROFILE_SCHEMA, body);

    const existingUserProfile = await prisma.bleeterProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingUserProfile) {
      throw new BadRequest("alreadyHasProfile");
    }

    const existingProfileWithHandle = await prisma.bleeterProfile.findUnique({
      where: { handle: data.handle.toLowerCase() },
    });

    if (existingProfileWithHandle) {
      throw new BadRequest("handleTaken");
    }

    const profile = await prisma.bleeterProfile.create({
      data: {
        handle: data.handle.toLowerCase(),
        name: data.name,
        bio: data.bio,
        userId: user.id,
      },
    });

    await prisma.bleeterPost.updateMany({
      where: { userId: user.id, creatorId: { equals: null } },
      data: {
        creatorId: profile.id,
      },
    });

    return profile;
  }
}
