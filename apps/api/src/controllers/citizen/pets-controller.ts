import { Feature, User } from "@prisma/client";
import { PET_MEDICAL_RECORD_SCHEMA, PET_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "lib/data/validate-schema";
import { IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/pets")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.PETS })
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

  @Get("/:id")
  @Description("Get a pet by id for the authenticated user")
  async getPetById(
    @PathParams("id") id: string,
    @Context("user") user: User,
  ): Promise<APITypes.GetPetByIdData> {
    const pet = await prisma.pet.findUnique({
      where: {
        id,
      },
      include: { citizen: true, medicalRecords: true },
    });

    if (!pet || pet.citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    return pet;
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

  @Post("/:petId/medical-records")
  @Description("Create a medical record for a pet")
  async createMedicalRecord(
    @PathParams("petId") id: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostPetByIdMedicalRecordsData> {
    const data = validateSchema(PET_MEDICAL_RECORD_SCHEMA, body);
    await this.validatePetMedicalRecord(id, user.id);

    const petMedicalRecord = await prisma.petMedicalRecord.create({
      data: {
        petId: id,
        description: data.description,
        type: data.type,
      },
    });

    return petMedicalRecord;
  }

  @Put("/:petId/medical-records/:medicalRecordId")
  @Description("Update a medical record for a pet")
  async updateMedicalRecord(
    @PathParams("petId") petId: string,
    @PathParams("medicalRecordId") medicalRecordId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PutPetByIdMedicalRecordsData> {
    const data = validateSchema(PET_MEDICAL_RECORD_SCHEMA, body);

    await this.validatePetMedicalRecord(petId, user.id, medicalRecordId);

    const updatedPetMedicalRecord = await prisma.petMedicalRecord.update({
      where: { id: medicalRecordId },
      data: {
        description: data.description,
        type: data.type,
      },
    });

    return updatedPetMedicalRecord;
  }

  @Delete("/:petId/medical-records/:medicalRecordId")
  @Description("Delete a medical record for a pet")
  async deleteMedicalRecord(
    @PathParams("petId") petId: string,
    @PathParams("medicalRecordId") medicalRecordId: string,
    @Context("user") user: User,
  ): Promise<APITypes.DeletePetByIdMedicalRecordsData> {
    await this.validatePetMedicalRecord(petId, user.id, medicalRecordId);
    await prisma.petMedicalRecord.delete({ where: { id: medicalRecordId } });

    return true;
  }

  private async validatePetMedicalRecord(petId: string, userId: string, medicalRecordId?: string) {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { citizen: { select: { userId: true } } },
    });

    if (!pet || pet.citizen.userId !== userId) {
      throw new NotFound("notFound");
    }

    const petMedicalRecord = await prisma.petMedicalRecord.findUnique({
      where: { id: medicalRecordId },
      include: { pet: true },
    });

    if (!petMedicalRecord || petMedicalRecord.petId !== petId) {
      throw new NotFound("notFound");
    }
  }
}
