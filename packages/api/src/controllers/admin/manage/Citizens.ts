import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Description, Get, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/user";
import { leoProperties } from "lib/leo/activeOfficer";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateImgurURL } from "utils/image";
import type { User } from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/citizens")
export class ManageCitizensController {
  @Get("/")
  @Description("Get all the citizens within the CAD")
  async getCitizens() {
    const citizens = await prisma.citizen.findMany({
      include: citizenInclude,
    });

    return citizens;
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

  @Get("/:id")
  @Description("Get a citizen by its id")
  @UsePermissions({
    permissions: [Permissions.ViewCitizens, Permissions.DeleteCitizens, Permissions.ManageCitizens],
  })
  async getCitizen(@PathParams("id") id: string) {
    const citizen = await prisma.citizen.findUnique({
      where: { id },
      include: citizenInclude,
    });

    return citizen;
  }

  @Put("/:id")
  @Description("Update a citizen by its id")
  @UsePermissions({
    permissions: [Permissions.ManageCitizens],
  })
  async updateCitizen(@PathParams("id") id: string, @BodyParams() body: unknown) {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const citizen = await prisma.citizen.update({
      where: { id },
      data: {
        address: data.address,
        postal: data.postal || null,
        weight: data.weight,
        height: data.height,
        hairColor: data.hairColor,
        dateOfBirth: data.dateOfBirth,
        ethnicityId: data.ethnicity,
        name: data.name,
        surname: data.surname,
        genderId: data.gender,
        eyeColor: data.eyeColor,
        driversLicenseId: data.driversLicense || undefined,
        weaponLicenseId: data.weaponLicense || undefined,
        pilotLicenseId: data.pilotLicense || undefined,
        phoneNumber: data.phoneNumber || null,
        socialSecurityNumber: generateString(9, { numbersOnly: true }),
        occupation: data.occupation || null,
        imageId: validateImgurURL(data.image),
      },
      include: citizenInclude,
    });

    return citizen;
  }

  @Delete("/:id")
  @Description("Delete a citizen by its id")
  @UsePermissions({
    permissions: [Permissions.DeleteCitizens],
  })
  async deleteCitizen(
    @Context("user") user: User,
    @BodyParams("reason") reason: string,
    @PathParams("id") citizenId: string,
  ) {
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
