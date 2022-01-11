import { User } from ".prisma/client";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Delete, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";

@Controller("/medical-records")
@UseBeforeEach(IsAuth)
export class MedicalRecordsController {
  @Post("/")
  async createMedicalRecord(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const user = ctx.get("user") as User;
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body.toJSON());

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: ctx.get("user").id,
        type: data.type,
        description: data.description,
        bloodGroupId: data.bloodGroup || null,
      },
      include: {
        bloodGroup: true,
      },
    });

    return medicalRecord;
  }

  @Put("/:id")
  async updateMedicalRecord(
    @Context() ctx: Context,
    @PathParams("id") recordId: string,
    @BodyParams() body: JsonRequestBody,
  ) {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body.toJSON());

    const record = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    if (!record || record.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
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

    return updated;
  }

  @Delete("/:id")
  async deleteMedicalRecord(@Context() ctx: Context, @PathParams("id") recordId: string) {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: {
        id: recordId,
      },
    });

    if (!medicalRecord || medicalRecord.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    await prisma.medicalRecord.delete({
      where: {
        id: medicalRecord.id,
      },
    });

    return true;
  }
}
