import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { leoProperties } from "lib/leo/activeOfficer";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateImgurURL } from "utils/image";
import { Prisma, Rank, User, WhitelistStatus } from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import {
  ACCEPT_DECLINE_TYPES,
  type AcceptDeclineType,
} from "controllers/admin/manage/AdminManageUnitsController";
import { isCuid } from "cuid";
import type * as APITypes from "@snailycad/types/api";
import { validateSocialSecurityNumber } from "lib/citizen/validateSSN";

const recordsInclude = {
  officer: { include: leoProperties },
  violations: {
    include: {
      penalCode: { include: { warningApplicable: true, warningNotApplicable: true } },
    },
  },
  seizedItems: true,
};

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/citizens")
@ContentType("application/json")
export class AdminManageCitizensController {
  @Get("/")
  @Description("Get all the citizens within the CAD")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ViewCitizens, Permissions.ManageCitizens, Permissions.DeleteCitizens],
  })
  async getCitizens(
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetManageCitizensData> {
    const [name, surname] = query.toString().toLowerCase().split(/ +/g);

    const where = query
      ? {
          OR: [
            {
              name: { contains: name, mode: Prisma.QueryMode.insensitive },
              surname: { contains: surname, mode: Prisma.QueryMode.insensitive },
            },
            {
              name: { equals: surname, mode: Prisma.QueryMode.insensitive },
              surname: { equals: name, mode: Prisma.QueryMode.insensitive },
            },
          ],
        }
      : undefined;

    const [totalCount, citizens] = await prisma.$transaction([
      prisma.citizen.count({ where }),
      prisma.citizen.findMany({
        where,
        include: citizenInclude,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : Number(skip),
      }),
    ]);

    return { totalCount, citizens };
  }

  @Get("/records-logs")
  @Description("Get all the record logs within the CAD")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewCitizens,
      Permissions.ManageCitizens,
      Permissions.DeleteCitizens,
      Permissions.ViewCitizenLogs,
    ],
  })
  async getRecordLogsForCitizen(): Promise<APITypes.GetManageRecordLogsData> {
    const citizens = await prisma.recordLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        warrant: { include: { officer: { include: leoProperties } } },
        records: { include: recordsInclude },
        citizen: {
          include: { user: { select: userProperties }, gender: true, ethnicity: true },
        },
      },
    });

    return citizens;
  }

  @Get("/:id")
  @Description(
    "Get a citizen by the `id`. Or get all citizens from a user by the `discordId` or `steamId`",
  )
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ViewCitizens, Permissions.ManageCitizens, Permissions.DeleteCitizens],
  })
  async getCitizen(@PathParams("id") id: string): Promise<APITypes.GetManageCitizenByIdData> {
    const isCitizenId = isCuid(id);
    const functionName = isCitizenId ? "findFirst" : "findMany";

    // @ts-expect-error same properties
    const citizen = await prisma.citizen[functionName]({
      include: citizenInclude,
      where: {
        OR: [{ user: { discordId: id } }, { user: { steamId: id } }, { id }],
      },
    });

    return citizen;
  }

  @Post("/records-logs/:id")
  @Description("Accept or decline a record by it's id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCitizens, Permissions.ViewCitizenLogs],
  })
  async acceptOrDeclineArrestReport(
    @PathParams("id") id: string,
    @BodyParams("type") type: AcceptDeclineType | null,
  ): Promise<APITypes.PostCitizenRecordLogsData> {
    if (!type || !ACCEPT_DECLINE_TYPES.includes(type)) {
      throw new BadRequest("invalidType");
    }

    const record = await prisma.record.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFound("recordNotFound");
    }

    const updated = await prisma.record.update({
      where: { id: record.id },
      data: {
        status: type === "ACCEPT" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED,
      },
      include: recordsInclude,
    });

    return updated;
  }

  @Put("/:id")
  @Description("Update a citizen by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCitizens],
  })
  async updateCitizen(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutManageCitizenByIdData> {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);
    const citizen = await prisma.citizen.findUnique({
      where: { id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    if (data.socialSecurityNumber) {
      await validateSocialSecurityNumber({
        socialSecurityNumber: data.socialSecurityNumber,
        citizenId: citizen.id,
      });
    }

    const updatedCitizen = await prisma.citizen.update({
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
        phoneNumber: data.phoneNumber,
        socialSecurityNumber:
          data.socialSecurityNumber ||
          (!citizen.socialSecurityNumber ? generateString(9, { numbersOnly: true }) : undefined),
        occupation: data.occupation,
        additionalInfo: data.additionalInfo,
        imageId: validateImgurURL(data.image),
        userId: data.userId || undefined,
        appearance: data.appearance || undefined,
      },
      include: citizenInclude,
    });

    return updatedCitizen;
  }

  @Delete("/:id")
  @Description("Delete a citizen by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteCitizens],
  })
  async deleteCitizen(
    @Context("user") user: User,
    @BodyParams("reason") reason: string,
    @PathParams("id") citizenId: string,
  ): Promise<APITypes.DeleteManageCitizenByIdData> {
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
