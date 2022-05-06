import type { CadFeature, User } from "@prisma/client";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Delete, Description, Post, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/user";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";

@Controller("/medical-records")
@UseBeforeEach(IsAuth)
export class MedicalRecordsController {
  @Post("/")
  @Description("Create a medical records for a citizen")
  async createMedicalRecord(@Context() ctx: Context, @BodyParams() body: unknown) {
    const user = ctx.get("user") as User;
    const cad = ctx.get("cad") as { features?: CadFeature[] };
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: ctx.get("user").id || undefined,
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
    @Context("cad") cad: { features?: CadFeature[] },
    @PathParams("id") recordId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const record = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
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
    @Context("cad") cad: { features: CadFeature[] },
    @PathParams("id") recordId: string,
  ) {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
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
