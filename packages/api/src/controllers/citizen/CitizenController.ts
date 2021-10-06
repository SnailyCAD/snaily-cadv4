import { UseBeforeEach, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post } from "@tsed/schema";
import { BodyParams, QueryParams } from "@tsed/platform-params";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { CREATE_CITIZEN_SCHEMA, validate } from "@snailycad/schemas";

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
  async getCitizen(@Context() ctx: Context, @QueryParams("id") citizenId: string) {
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: ctx.get("user").id,
      },
    });

    if (!citizen) {
      throw new NotFound("Citizen not found");
    }

    return citizen;
  }

  @Delete("/:id")
  async deleteCitizen(@Context() ctx: Context, @QueryParams("id") citizenId: string) {
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

    console.log(error);

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
      fullName,
      gender,
    } = body.toJSON();

    const citizen = await prisma.citizen.create({
      data: {
        userId: ctx.get("user").id,
        address,
        weight,
        height,
        hairColor,
        dateOfBirth,
        ethnicity,
        fullName,
        gender,
        eyeColor,
      },
    });

    return citizen;
  }
}
