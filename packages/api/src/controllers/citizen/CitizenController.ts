import { UseBeforeEach, Context, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { CREATE_CITIZEN_SCHEMA, validate } from "@snailycad/schemas";
import fs from "node:fs";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";

@Controller("/citizen")
@UseBeforeEach(IsAuth)
export class CitizenController {
  @Get("/")
  async getCitizens(@Context() ctx: Context) {
    const citizens = await prisma.citizen.findMany({
      where: {
        userId: ctx.get("user").id,
      },
    });

    return citizens;
  }

  @Get("/:id")
  async getCitizen(@Context() ctx: Context, @PathParams("id") citizenId: string) {
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: ctx.get("user").id,
      },
      include: {
        vehicles: true,
        weapons: true,
        medicalRecords: true,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    return citizen;
  }

  @Delete("/:id")
  async deleteCitizen(@Context() ctx: Context, @PathParams("id") citizenId: string) {
    await prisma.citizen.deleteMany({
      where: {
        id: citizenId,
        userId: ctx.get("user").id,
      },
    });

    return true;
  }

  @Post("/")
  async createCitizen(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(CREATE_CITIZEN_SCHEMA(true), body.toJSON(), true);

    if (error) {
      return new BadRequest(error);
    }

    const {
      address,
      weight,
      height,
      hairColor,
      eyeColor,
      dateOfBirth,
      ethnicity,
      name,
      surname,
      gender,
    } = body.toJSON();

    const existing = await prisma.citizen.findFirst({
      where: {
        name,
        surname,
      },
    });

    if (existing) {
      throw new BadRequest("nameAlreadyTaken");
    }

    const citizen = await prisma.citizen.create({
      data: {
        userId: ctx.get("user").id,
        address,
        weight,
        height,
        hairColor,
        dateOfBirth,
        ethnicity,
        name,
        surname,
        gender,
        eyeColor,
      },
    });

    return citizen;
  }

  @Post("/:id")
  async uploadImageToCitizen(
    @Context() ctx: Context,
    @PathParams("id") citizenId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("Not Found");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
      // todo: add alert here
      // helpers.setFieldError("image", `Only ${allowedFileExtensions.join(", ")} are supported`);
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/citizens/${citizen.id}.${extension}`;
    console.log({ path });

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.citizen.update({
      where: {
        id: citizenId,
      },
      data: {
        imageId: `${citizen.id}.${extension}`,
      },
      select: {
        imageId: true,
      },
    });

    return data;
  }
}
