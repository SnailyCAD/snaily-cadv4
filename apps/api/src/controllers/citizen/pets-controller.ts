import { Feature, type User } from "@prisma/client";
import { PET_NOTE_SCHEMA, PET_MEDICAL_RECORD_SCHEMA, PET_SCHEMA } from "@snailycad/schemas";
import {
  UseBeforeEach,
  Context,
  BodyParams,
  PathParams,
  MultipartFile,
  type PlatformMulterFile,
} from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "lib/data/validate-schema";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { type AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { getImageWebPPath } from "~/lib/images/get-image-webp-path";
import fs from "node:fs/promises";
import { validateImageURL } from "~/lib/images/validate-image-url";

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
      include: { citizen: true, medicalRecords: true, notes: true },
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
    const validatedImageURL = validateImageURL(data.image);

    const pet = await prisma.pet.create({
      data: {
        breed: data.breed,
        name: data.name,
        citizenId: data.citizenId,
        color: data.color,
        dateOfBirth: data.dateOfBirth,
        weight: data.weight,
        imageId: validatedImageURL,
      },
      include: {
        citizen: true,
      },
    });

    return pet;
  }

  @Post("/:petId/image")
  @Description("Upload the image for a pet")
  async uploadPetImage(
    @PathParams("petId") id: string,
    @Context("user") user: User,
    @MultipartFile("image") file?: PlatformMulterFile,
  ) {
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { citizen: { select: { userId: true } } },
    });

    if (!pet || pet.citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." }, "invalidImageType");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" }, "invalidImageType");
    }

    const image = await getImageWebPPath({
      buffer: file.buffer,
      pathType: "pets",
      id: `${pet.id}-${file.originalname.split(".")[0]}`,
    });

    const previousImage = pet.imageId ? `${process.cwd()}/public/pets/${pet.imageId}` : undefined;
    if (previousImage) {
      await fs.rm(previousImage, { force: true });
    }

    const [data] = await Promise.all([
      prisma.pet.update({
        where: { id: pet.id },
        data: { imageId: image.fileName },
        select: { imageId: true },
      }),
      fs.writeFile(image.path, image.buffer),
    ]);

    return data;
  }

  @Put("/:petId")
  @Description("Update a pet for a citizen")
  async updatePet(
    @PathParams("petId") id: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ) {
    const data = validateSchema(PET_SCHEMA, body);
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { citizen: { select: { userId: true } } },
    });

    if (!pet || pet.citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const validatedImageURL = validateImageURL(data.image);
    const petMedicalRecord = await prisma.pet.update({
      where: {
        id: pet.id,
      },
      data: {
        breed: data.breed,
        color: data.color,
        dateOfBirth: data.dateOfBirth,
        weight: data.weight,
        imageId: validatedImageURL,
      },
    });

    return petMedicalRecord;
  }

  @Delete("/:petId")
  @Description("Delete a pet for a citizen")
  async deletePet(@PathParams("petId") id: string, @Context("user") user: User) {
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { citizen: { select: { userId: true } } },
    });

    if (!pet || pet.citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    await prisma.pet.delete({ where: { id: pet.id } });

    return true;
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

  @Post("/:petId/notes")
  @Description("Create a nte for a pet")
  async createNote(
    @PathParams("petId") id: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostPetByIdNotesData> {
    const data = validateSchema(PET_NOTE_SCHEMA, body);
    await this.validatePetNote(id, user.id);

    const petNote = await prisma.note.create({
      data: {
        petId: id,
        text: data.text,
      },
    });

    return petNote;
  }

  @Put("/:petId/notes/:noteId")
  @Description("Update a note for a pet")
  async updateNote(
    @PathParams("petId") petId: string,
    @PathParams("noteId") noteId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PutPetByIdNotesData> {
    const data = validateSchema(PET_NOTE_SCHEMA, body);
    await this.validatePetNote(petId, user.id, noteId);

    const updatedPetNote = await prisma.note.update({
      where: { id: noteId },
      data: { text: data.text },
    });

    return updatedPetNote;
  }

  @Delete("/:petId/notes/:noteId")
  @Description("Delete a nte for a pet")
  async deleteNote(
    @PathParams("petId") petId: string,
    @PathParams("noteId") noteId: string,
    @Context("user") user: User,
  ): Promise<APITypes.DeletePetByIdNotesData> {
    await this.validatePetNote(petId, user.id, noteId);
    await prisma.note.delete({ where: { id: noteId } });

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

    if (medicalRecordId) {
      const petMedicalRecord = await prisma.petMedicalRecord.findUnique({
        where: { id: medicalRecordId },
      });

      if (!petMedicalRecord || petMedicalRecord.petId !== petId) {
        throw new NotFound("notFound");
      }
    }
  }

  private async validatePetNote(petId: string, userId: string, noteId?: string) {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { citizen: { select: { userId: true } } },
    });

    if (!pet || pet.citizen.userId !== userId) {
      throw new NotFound("notFound");
    }

    if (noteId) {
      const petNote = await prisma.note.findUnique({
        where: { id: noteId },
      });

      if (!petNote || petNote.petId !== petId) {
        throw new NotFound("notFound");
      }
    }
  }
}
