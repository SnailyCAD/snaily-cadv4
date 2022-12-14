import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { QueryParams, BodyParams, PathParams } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateImgurURL } from "utils/image";
import { Prisma, Rank } from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { isCuid } from "cuid";
import type * as APITypes from "@snailycad/types/api";
import { validateSocialSecurityNumber } from "lib/citizen/validateSSN";

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
    @QueryParams("userId", String) userId?: string,
  ): Promise<APITypes.GetManageCitizensData> {
    const [name, surname] = query.toString().toLowerCase().split(/ +/g);

    const where =
      query || userId
        ? {
            userId,
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
        include: {
          gender: true,
          ethnicity: true,
          user: citizenInclude.user,
        },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : Number(skip),
      }),
    ]);

    return { totalCount, citizens };
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

    const OR: Prisma.CitizenWhereInput["OR"] = [{ id }];

    if (!isCitizenId) {
      OR.push({ user: { discordId: id } }, { user: { steamId: id } });
    }

    // @ts-expect-error same properties
    const citizen = await prisma.citizen[functionName]({
      include: citizenInclude,
      where: { OR },
    });

    if (Array.isArray(citizen) && citizen.length <= 0) {
      return null;
    }

    return citizen;
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
    const data = validateSchema(CREATE_CITIZEN_SCHEMA.partial(), body);
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
        driversLicenseId: data.driversLicense,
        weaponLicenseId: data.weaponLicense,
        pilotLicenseId: data.pilotLicense,
        phoneNumber: data.phoneNumber,
        socialSecurityNumber:
          data.socialSecurityNumber ||
          (!citizen.socialSecurityNumber ? generateString(9, { numbersOnly: true }) : undefined),
        occupation: data.occupation,
        additionalInfo: data.additionalInfo,
        imageId: validateImgurURL(data.image),
        userId: data.userId || undefined,
        appearance: data.appearance,
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

    await prisma.citizen.delete({ where: { id: citizenId } });

    return true;
  }
}
