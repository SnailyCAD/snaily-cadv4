import * as yup from "yup";
import { UseBeforeEach, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";
import { validateSchema } from "@casper124578/utils";
import { BadRequest } from "@tsed/exceptions";

const citizenSchema = {
  fullName: yup.string().required().max(255),
  address: yup.string().required().max(255),
  ethnicity: yup.string().required().max(255),
  gender: yup.string().required().max(255),
  dateOfBirth: yup.date().required(),
  hairColor: yup.string().required().max(255),
  eyeColor: yup.string().required().max(255),
  height: yup.string().required().max(255),
  weight: yup.string().required().max(255),
};

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

  @Post("/")
  async createCitizen(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const [error] = await validateSchema(citizenSchema, body);
    if (error) {
      return new BadRequest(error.message);
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

    return { citizen };
  }
}
