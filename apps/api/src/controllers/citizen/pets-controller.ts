import { Feature, User } from "@prisma/client";
import { PET_NOTE_SCHEMA, PET_MEDICAL_RECORD_SCHEMA, PET_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "lib/data/validate-schema";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";

@Controller("/pets")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.PETS })
export class PetsController {
  @Get("/")
  @Description("Get all the pets for the authenticated user")
  async getUserPets(@SessionUser() user: User): Promise<APITypes.GetUserPetsData> {
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
    @Param("id") id: string,
    @SessionUser() user: User,
  ): Promise<APITypes.GetPetByIdData> {
    const pet = await prisma.pet.findUnique({
      where: {
        id,
      },
      include: { citizen: true, medicalRecords: true, notes: true },
    });

    if (!pet || pet.citizen.userId !== user.id) {
      throw new NotFoundException("notFound");
    }

    return pet;
  }

  @Post("/")
  @Description("Create a pet for a citizen")
  async createPet(@Body() body: unknown): Promise<APITypes.PostPetsData> {
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
    @Param("petId") id: string,
    @Body() body: unknown,
    @SessionUser() user: User,
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
    @Param("petId") petId: string,
    @Param("medicalRecordId") medicalRecordId: string,
    @Body() body: unknown,
    @SessionUser() user: User,
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
    @Param("petId") petId: string,
    @Param("medicalRecordId") medicalRecordId: string,
    @SessionUser() user: User,
  ): Promise<APITypes.DeletePetByIdMedicalRecordsData> {
    await this.validatePetMedicalRecord(petId, user.id, medicalRecordId);
    await prisma.petMedicalRecord.delete({ where: { id: medicalRecordId } });

    return true;
  }

  @Post("/:petId/notes")
  @Description("Create a nte for a pet")
  async createNote(
    @Param("petId") id: string,
    @Body() body: unknown,
    @SessionUser() user: User,
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
    @Param("petId") petId: string,
    @Param("noteId") noteId: string,
    @Body() body: unknown,
    @SessionUser() user: User,
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
    @Param("petId") petId: string,
    @Param("noteId") noteId: string,
    @SessionUser() user: User,
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
      throw new NotFoundException("notFound");
    }

    if (medicalRecordId) {
      const petMedicalRecord = await prisma.petMedicalRecord.findUnique({
        where: { id: medicalRecordId },
      });

      if (!petMedicalRecord || petMedicalRecord.petId !== petId) {
        throw new NotFoundException("notFound");
      }
    }
  }

  private async validatePetNote(petId: string, userId: string, noteId?: string) {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { citizen: { select: { userId: true } } },
    });

    if (!pet || pet.citizen.userId !== userId) {
      throw new NotFoundException("notFound");
    }

    if (noteId) {
      const petNote = await prisma.note.findUnique({
        where: { id: noteId },
      });

      if (!petNote || petNote.petId !== petId) {
        throw new NotFoundException("notFound");
      }
    }
  }
}
