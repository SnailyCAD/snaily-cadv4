import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, Put } from "@tsed/schema";
import { userProperties } from "lib/auth";
import { leoProperties } from "lib/officer";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateImgurURL } from "utils/image";
import type { User } from "@prisma/client";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/citizens")
export class ManageCitizensController {
  @Get("/")
  async getCitizens() {
    const citizens = await prisma.citizen.findMany({
      include: citizenInclude,
    });

    return citizens;
  }

  @Get("/:id")
  async getCitizen(@PathParams("id") id: string) {
    const citizen = await prisma.citizen.findUnique({
      where: { id },
      include: citizenInclude,
    });

    return citizen;
  }

  @Put("/:id")
  async updateCitizen(@PathParams("id") id: string, @BodyParams() body: any) {
    // todo: use admin import schema. This schema should be updated in the next PR (issue ref #323)
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const citizen = await prisma.citizen.update({
      where: { id },
      data: {
        address: data.address,
        postal: body.postal || null,
        weight: data.weight,
        height: data.height,
        hairColor: data.hairColor,
        dateOfBirth: data.dateOfBirth,
        ethnicityId: data.ethnicity,
        name: data.name,
        surname: data.surname,
        genderId: data.gender,
        eyeColor: data.eyeColor,
        driversLicenseId: body.driversLicense || undefined,
        weaponLicenseId: body.weaponLicense || undefined,
        pilotLicenseId: body.pilotLicense || undefined,
        ccwId: body.ccw || undefined,
        phoneNumber: body.phoneNumber || null,
        socialSecurityNumber: generateString(9, { numbersOnly: true }),
        occupation: body.occupation || null,
        imageId: validateImgurURL(body.image),
      },
      include: citizenInclude,
    });

    return citizen;
  }

  @Get("/records-logs")
  async getRecordLogsForCitizen() {
    const citizens = await prisma.recordLog.findMany({
      include: {
        warrant: { include: { officer: { include: leoProperties } } },
        records: {
          include: {
            officer: { include: leoProperties },
            violations: { include: { penalCode: true } },
          },
        },
        citizen: {
          include: { user: { select: userProperties }, gender: true, ethnicity: true },
        },
      },
    });

    return citizens;
  }

  @Delete("/:id")
  async deleteCitizen(
    @Context("user") user: User,
    @BodyParams() body: any,
    @PathParams("id") citizenId: string,
  ) {
    const reason = body.reason;

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    if (citizen.userId) {
      await prisma.notification.create({
        data: {
          userId: citizen.userId,
          executorId: user.id,
          description: reason,
          title: "CITIZEN_DELETED",
        },
      });
    }

    await prisma.citizen.delete({
      where: {
        id: citizenId,
      },
    });

    return true;
  }
}
