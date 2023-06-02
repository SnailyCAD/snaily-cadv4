import type { cad, Feature, User } from "@prisma/client";
import { MEDICAL_RECORD_SCHEMA, PET_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "lib/data/validate-schema";

@Controller("/pets")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class PetsController {
  @Get("/")
  @Description("Get all the pets for the authenticated user")
  async getUserPets(@Context("user") user: User): Promise<APITypes.GetUserPetsData> {
    const where = {
      citizen: { userId: user.id },
    };

    const [totalCount, pets] = await prisma.$transaction([
      prisma.pet.count({
        where,
      }),
      prisma.pet.findMany({ where, include: { citizen: true } }),
    ]);

    return { totalCount, pets };
  }

  @Post("/")
  @Description("Create a pet for a citizen")
  async createPet(@BodyParams() body: unknown): Promise<APITypes.PostPetsData> {
    const data = validateSchema(PET_SCHEMA, body);

    const pet = await prisma.pet.create({
      data: {
        breed: data.breed,
        name: data.name,
        citizenId: data.citizenId,
        color: data.color,
        dateOfBirth: data.dateOfBirth,
        weight: data.weight,
      },
      include: {
        citizen: true,
      },
    });

    return pet;
  }
}
