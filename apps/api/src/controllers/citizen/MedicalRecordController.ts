import type { cad, Feature, User } from "@prisma/client";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import type * as APITypes from "@snailycad/types/api";
import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";

@Controller("/medical-records")
@UseGuards(AuthGuard)
export class MedicalRecordsController {
  @Post("/")
  @Description("Create a medical records for a citizen")
  async createMedicalRecord(
    @SessionUser() user: User,
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @Body() body: unknown,
  ): Promise<APITypes.PostCitizenMedicalRecordsData> {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFoundException("notFound"));
    } else if (!citizen) {
      throw new NotFoundException("citizenNotFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: user.id || undefined,
        type: data.type,
        description: data.description,
        bloodGroupId: data.bloodGroup || null,
      },
      include: {
        bloodGroup: true,
      },
    });

    await prisma.medicalRecord.updateMany({
      where: { citizenId: citizen.id },
      data: { bloodGroupId: data.bloodGroup || undefined },
    });

    return medicalRecord;
  }

  @Put("/:id")
  @Description("Update a medical record by its id")
  async updateMedicalRecord(
    @SessionUser() user: User,
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @Param("id") recordId: string,
    @Body() body: unknown,
  ): Promise<APITypes.PutCitizenMedicalRecordsData> {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const record = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(record?.userId, user, new NotFoundException("notFound"));
    } else if (!record) {
      throw new NotFoundException("recordNotFound");
    }

    const updated = await prisma.medicalRecord.update({
      where: {
        id: record.id,
      },
      data: {
        description: data.description,
        type: data.type,
        bloodGroupId: data.bloodGroup || null,
      },
      include: {
        bloodGroup: true,
      },
    });

    await prisma.medicalRecord.updateMany({
      where: { citizenId: record.citizenId },
      data: { bloodGroupId: data.bloodGroup || undefined },
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a medical record by its id")
  async deleteMedicalRecord(
    @SessionUser() user: User,
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @Param("id") recordId: string,
  ): Promise<APITypes.DeleteCitizenMedicalRecordsData> {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(medicalRecord?.userId, user, new NotFoundException("notFound"));
    } else if (!medicalRecord) {
      throw new NotFoundException("medicalRecordNotFound");
    }

    await prisma.medicalRecord.delete({
      where: {
        id: medicalRecord.id,
      },
    });

    return true;
  }
}
