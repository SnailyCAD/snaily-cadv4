import { Controller } from "@tsed/di";
import { Get, Post, Description, Delete } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { WEAPON_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/weapons";
import {
  BodyParams,
  MultipartFile,
  PathParams,
  PlatformMulterFile,
  QueryParams,
  UseBeforeEach,
} from "@tsed/common";
import { IsAuth } from "middlewares/IsAuth";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import type { Prisma } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";

const weaponsInclude = { ...citizenInclude.weapons.include, citizen: true };

@Controller("/admin/import/weapons")
@UseBeforeEach(IsAuth)
export class ImportWeaponsController {
  @Get("/")
  @Description("Get all the Weapons in the CAD (paginated)")
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
  @Description("Import weapons in the CAD via body data")
  async importWeaponsViaBodyData(@BodyParams() body: any): Promise<APITypes.PostImportWeaponsData> {
    return importWeaponsHandler(body);
  }

  @Post("/file")
  @Description("Import weapons in the CAD via file upload")
  async importWeaponsViaFile(
    @MultipartFile("file") file: PlatformMulterFile,
  ): Promise<APITypes.PostImportWeaponsData> {
    const toValidateBody = parseImportFile(file);
    return importWeaponsHandler(toValidateBody);
  }

  @Delete("/:id")
  @Description("Delete a registered weapon by its id")
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
