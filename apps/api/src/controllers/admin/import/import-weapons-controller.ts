import { Controller } from "@tsed/di";
import { Get, Post, Description, Delete, ContentType } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { WEAPON_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/weapons";
import {
  BodyParams,
  MultipartFile,
  PathParams,
  PlatformMulterFile,
  QueryParams,
  UseBeforeEach,
} from "@tsed/common";
import { IsAuth } from "middlewares/is-auth";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/data/validate-schema";
import { generateString } from "utils/generate-string";
import { citizenInclude } from "controllers/citizen/CitizenController";
import type { Prisma } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { Rank } from "@snailycad/types";

const weaponsInclude = { ...citizenInclude.weapons.include, citizen: true };

@Controller("/admin/import/weapons")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class ImportWeaponsController {
  @Get("/")
  @Description("Get all the Weapons in the CAD (paginated)")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ImportRegisteredWeapons, Permissions.ManageCitizens],
  })
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

    const [totalCount, weapons] = await prisma.$transaction([
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
  @Description("Import weapons in the CAD via body data")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ImportRegisteredWeapons],
  })
  async importWeaponsViaBodyData(@BodyParams() body: any): Promise<APITypes.PostImportWeaponsData> {
    return importWeaponsHandler(body);
  }

  @Get("/random")
  @Description("Get a random weapon")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ImportRegisteredWeapons, Permissions.ManageCitizens],
  })
  async getRandomWeapon(@QueryParams("userRegisteredOnly", Boolean) userRegisteredOnly?: boolean) {
    const where: Prisma.CitizenWhereInput = {};
    if (typeof userRegisteredOnly === "boolean") {
      where.userId = userRegisteredOnly ? { not: { equals: null } } : { equals: null };
    }

    const weaponCount = await prisma.weapon.count({ where });
    const randomSkip = Math.floor(Math.random() * weaponCount) + 0;

    const [weapon] = await prisma.weapon.findMany({
      where,
      skip: randomSkip,
      take: 1,
      include: weaponsInclude,
    });

    return weapon ?? null;
  }

  @Post("/file")
  @Description("Import weapons in the CAD via file upload")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ImportRegisteredWeapons],
  })
  async importWeaponsViaFile(
    @MultipartFile("file") file: PlatformMulterFile,
  ): Promise<APITypes.PostImportWeaponsData> {
    const toValidateBody = parseImportFile(file);
    return importWeaponsHandler(toValidateBody);
  }

  @Delete("/:id")
  @Description("Delete a registered weapon by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteRegisteredWeapons],
  })
  async deleteWeapon(@PathParams("id") id: string): Promise<APITypes.DeleteImportWeaponsData> {
    await prisma.weapon.delete({ where: { id } });

    return true;
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
