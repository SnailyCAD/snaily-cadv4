import { User } from ".prisma/client";
import { validate, MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { Delete, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";

@Controller("/medical-records")
@UseBeforeEach(IsAuth)
export class MedicalRecordsController {
  @Post("/")
  async createMedicalRecord(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(MEDICAL_RECORD_SCHEMA, body.toJSON(), true);
    const user = ctx.get("user") as User;

    if (error) {
      return new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: ctx.get("user").id,
        type: body.get("type"),
        description: body.get("description"),
        bloodGroupId: body.get("bloodGroup") || null,
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
    const error = validate(MEDICAL_RECORD_SCHEMA, body.toJSON(), true);

    if (error) {
      return new BadRequest(error);
    }

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
        description: body.get("description"),
        type: body.get("type"),
        bloodGroupId: body.get("bloodGroup") || null,
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
