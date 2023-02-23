import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { QueryParams, BodyParams, PathParams, Context } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { generateString } from "utils/generate-string";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { validateImageURL } from "lib/images/validate-image-url";
import { Feature, Prisma, Rank } from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { isCuid } from "cuid";
import type * as APITypes from "@snailycad/types/api";
import { validateSocialSecurityNumber } from "lib/citizen/validateSSN";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { isFeatureEnabled } from "lib/cad";

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
    @QueryParams("includeOfficers", Boolean) includeOfficers = false,
    @QueryParams("includeDeputies", Boolean) includeDeputies = false,
  ): Promise<APITypes.GetManageCitizensData> {
    const [name, surname] = query.toString().toLowerCase().split(/ +/g);

    const where =
      query || userId
        ? {
            userId,
            OR: [
              { id: query },
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
          officers: includeOfficers ? { include: leoProperties } : undefined,
          emsFdDeputies: includeDeputies ? { include: unitProperties } : undefined,
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
    @Context("sessionUserId") sessionUserId: string,
    @Context("cad") cad: { features: Record<Feature, boolean> },
  ): Promise<APITypes.PutManageCitizenByIdData> {
    const include = {
      gender: true,
      ethnicity: true,
    };

    const data = validateSchema(CREATE_CITIZEN_SCHEMA.partial(), body);
    const citizen = await prisma.citizen.findUnique({
      where: { id },
      include,
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const isEditableSSNEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.EDITABLE_SSN,
      defaultReturn: true,
    });

    if (data.socialSecurityNumber && isEditableSSNEnabled) {
      await validateSocialSecurityNumber({
        socialSecurityNumber: data.socialSecurityNumber,
        citizenId: citizen.id,
      });
    }

    const validatedImageURL = validateImageURL(data.image);

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
          data.socialSecurityNumber && isEditableSSNEnabled
            ? data.socialSecurityNumber
            : !citizen.socialSecurityNumber
            ? generateString(9, { type: "numbers-only" })
            : undefined,
        occupation: data.occupation,
        additionalInfo: data.additionalInfo,
        imageId: validatedImageURL,
        imageBlurData: await generateBlurPlaceholder(validatedImageURL),
        userId: data.userId || undefined,
        appearance: data.appearance,
      },
      include,
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.CitizenUpdate, new: updatedCitizen, previous: citizen },
      prisma,
      executorId: sessionUserId,
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
    @Context("sessionUserId") sessionUserId: string,
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

    await createAuditLogEntry({
      translationKey: "deletedEntry",
      action: { type: AuditLogActionType.CitizenDelete, new: citizen },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }
}
