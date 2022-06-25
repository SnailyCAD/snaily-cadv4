import { Controller } from "@tsed/di";
import { Get, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { WEAPON_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/weapons";
import { BodyParams, MultipartFile, PlatformMulterFile, QueryParams } from "@tsed/common";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import type { Prisma } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";

const weaponsInclude = { ...citizenInclude.weapons.include, citizen: true };

@Controller("/admin/import/weapons")
export class ImportWeaponsController {
  @Get("/")
  async getWeapons(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetImportWeaponsData> {
    const where: Prisma.WeaponWhereInput | undefined = query
      ? {
          OR: [
            { serialNumber: { contains: query, mode: "insensitive" } },
            { model: { value: { value: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : undefined;

    const [totalCount, weapons] = await Promise.all([
      prisma.weapon.count({ where }),
      prisma.weapon.findMany({
        include: weaponsInclude,
        where,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { totalCount, weapons };
  }

  @Post("/")
  async importWeapons(
    @BodyParams() body: unknown,
    @MultipartFile("file") file?: PlatformMulterFile,
  ): Promise<APITypes.PostImportWeaponsData> {
    const toValidateBody = file ? parseImportFile(file) : body;
    return importWeaponsHandler(toValidateBody);
  }
}

export async function importWeaponsHandler(body: unknown[]) {
  const data = validateSchema(WEAPON_SCHEMA_ARR, body);

  return Promise.all(
    data.map(async (data) => {
      return prisma.weapon.create({
        data: {
          citizenId: data.ownerId,
          registrationStatusId: data.registrationStatusId,
          modelId: data.modelId,
          serialNumber: generateString(10),
        },
        include: weaponsInclude,
      });
    }),
  );
}
