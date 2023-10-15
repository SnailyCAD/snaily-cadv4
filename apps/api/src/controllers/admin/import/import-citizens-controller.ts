import { Controller } from "@tsed/di";
import { Get, Post, Description, ContentType } from "@tsed/schema";
import { Prisma } from "@prisma/client";
import { prisma } from "lib/data/prisma";
import {
  QueryParams,
  BodyParams,
  MultipartFile,
  type PlatformMulterFile,
  UseBeforeEach,
} from "@tsed/common";
import { IsAuth } from "middlewares/auth/is-auth";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/data/validate-schema";
import { generateString } from "utils/generate-string";
import { IMPORT_CITIZENS_ARR } from "@snailycad/schemas/dist/admin/import/citizens";
import { importVehiclesHandler } from "./import-vehicles-controller";
import { importWeaponsHandler } from "./import-weapons-controller";
import { updateCitizenLicenseCategories } from "~/lib/citizen/licenses/update-citizen-license-categories";
import { manyToManyHelper } from "lib/data/many-to-many";
import type * as APITypes from "@snailycad/types/api";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { citizenInclude } from "controllers/citizen/CitizenController";

@Controller("/admin/import/citizens")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class ImportCitizensController {
  @Post("/file")
  @Description("Import citizens in the CAD via file upload")
  @UsePermissions({
    permissions: [Permissions.ImportCitizens, Permissions.ManageCitizens],
  })
  async importCitizens(
    @MultipartFile("file") file: PlatformMulterFile,
  ): Promise<APITypes.PostImportCitizensData> {
    const toValidateBody = parseImportFile(file);
    return this.importCitizensHandler(toValidateBody);
  }

  @Post("/")
  @Description("Import citizens in the CAD via body data")
  @UsePermissions({
    permissions: [Permissions.ImportCitizens, Permissions.ManageCitizens],
  })
  async importCitizensViaBodyData(
    @BodyParams() body: any,
  ): Promise<APITypes.PostImportCitizensData> {
    return this.importCitizensHandler(body);
  }

  @Get("/random")
  @Description("Get a random citizen")
  @UsePermissions({
    permissions: [Permissions.ImportCitizens, Permissions.ManageCitizens],
  })
  async getRandomCitizen(@QueryParams("userRegisteredOnly", Boolean) userRegisteredOnly?: boolean) {
    const where: Prisma.CitizenWhereInput = {};
    if (typeof userRegisteredOnly === "boolean") {
      where.userId = userRegisteredOnly ? { not: { equals: null } } : { equals: null };
    }

    const citizenCount = await prisma.citizen.count({ where });
    const randomSkip = Math.floor(Math.random() * citizenCount) + 0;

    const [citizen] = await prisma.citizen.findMany({
      where,
      skip: randomSkip,
      take: 1,
      include: citizenInclude,
    });

    return citizen ?? null;
  }

  @Get("/citizen-ids")
  @Description("Get all citizen IDs in the CAD")
  @UsePermissions({
    permissions: [Permissions.ImportCitizens, Permissions.ManageCitizens],
  })
  async getCitizenIds(
    @QueryParams("query", String) query = "",
    @QueryParams("userRegisteredOnly", Boolean) userRegisteredOnly?: boolean,
  ) {
    const where: Prisma.CitizenWhereInput | undefined = {};

    if (query) {
      const [name, surname] = query.toString().toLowerCase().split(/ +/g);

      where.OR = [
        { id: query },
        {
          name: { contains: name, mode: Prisma.QueryMode.insensitive },
          surname: { contains: surname, mode: Prisma.QueryMode.insensitive },
        },
        {
          name: { equals: surname, mode: Prisma.QueryMode.insensitive },
          surname: { equals: name, mode: Prisma.QueryMode.insensitive },
        },
      ];
    }

    if (typeof userRegisteredOnly === "boolean") {
      where.userId = userRegisteredOnly ? { not: { equals: null } } : { equals: null };
    }

    const ids = await prisma.citizen.findMany({
      where,
      select: { id: true },
    });

    return ids;
  }

  async importCitizensHandler(body: unknown) {
    const data = validateSchema(IMPORT_CITIZENS_ARR, body);

    return Promise.all(
      data.map(async (data) => {
        const citizen = await prisma.citizen.create({
          data: {
            userId: data.userId ?? undefined,
            name: data.name,
            surname: data.surname,
            ethnicityId: data.ethnicity,
            genderId: data.gender,
            dateOfBirth: new Date(data.dateOfBirth),
            address: data.address ?? "",
            eyeColor: data.eyeColor ?? "",
            hairColor: data.hairColor ?? "",
            height: data.height ?? "",
            weight: data.weight ?? "",
            socialSecurityNumber:
              data.socialSecurityNumber || generateString(9, { type: "numbers-only" }),
            weaponLicenseId: data.weaponLicenseId ?? null,
            driversLicenseId: data.driversLicenseId ?? null,
            pilotLicenseId: data.pilotLicenseId ?? null,
            postal: data.postal ?? null,
            phoneNumber: data.phoneNumber ?? null,
            occupation: data.occupation ?? null,
          },
          include: { gender: true, ethnicity: true, suspendedLicenses: true },
        });

        if (data.vehicles) {
          await importVehiclesHandler(
            data.vehicles.map((v) => ({ ...v, userId: data.userId, ownerId: citizen.id })),
          );
        }

        if (data.weapons) {
          await importWeaponsHandler(
            data.weapons.map((v) => ({ ...v, userId: data.userId, ownerId: citizen.id })),
          );
        }

        if (data.flags) {
          const disconnectConnectArr = manyToManyHelper([], data.flags, { showUpsert: false });

          await prisma.$transaction(
            disconnectConnectArr.map((v) =>
              prisma.citizen.update({ where: { id: citizen.id }, data: { flags: v } }),
            ),
          );
        }

        const licenseData = {
          driversLicenseCategory: data.driversLicenseCategoryIds,
          pilotLicenseCategory: data.pilotLicenseCategoryIds,
          waterLicenseCategory: data.waterLicenseCategoryIds,
          firearmLicenseCategory: data.firearmLicenseCategoryIds,
        };

        const updated = await updateCitizenLicenseCategories(citizen, licenseData, {
          gender: true,
          ethnicity: true,
          weaponLicense: true,
          huntingLicense: true,
          fishingLicense: true,
          driversLicense: true,
          pilotLicense: true,
          waterLicense: true,
          dlCategory: { include: { value: true } },
        });

        return updated;
      }),
    );
  }
}
