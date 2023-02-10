import type { cad, Feature, User } from "@prisma/client";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Post, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import type * as APITypes from "@snailycad/types/api";

@Controller("/medical-records")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class MedicalRecordsController {
  @Post("/")
  @Description("Create a medical records for a citizen")
  async createMedicalRecord(
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostCitizenMedicalRecordsData> {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("citizenNotFound");
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
    @Context("user") user: User,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @PathParams("id") recordId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCitizenMedicalRecordsData> {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const record = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(record?.userId, user, new NotFound("notFound"));
    } else if (!record) {
      throw new NotFound("recordNotFound");
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
    @Context("user") user: User,
    @Context("cad") cad: { features: Record<Feature, boolean> },
    @PathParams("id") recordId: string,
  ): Promise<APITypes.DeleteCitizenMedicalRecordsData> {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(medicalRecord?.userId, user, new NotFound("notFound"));
    } else if (!medicalRecord) {
      throw new NotFound("medicalRecordNotFound");
    }

    await prisma.medicalRecord.delete({
      where: {
        id: medicalRecord.id,
      },
    });

    return true;
  }
}
