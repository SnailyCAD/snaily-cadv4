import { Controller } from "@tsed/di";
import { Get, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { WEAPON_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/weapons";
import { BodyParams, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";

const weaponsInclude = { ...citizenInclude.weapons.include, citizen: true };

@Controller("/admin/import/weapons")
export class ImportWeaponsController {
  @Get("")
  async getWeapons() {
    const weapons = await prisma.weapon.findMany({ include: weaponsInclude });
    return weapons;
  }

  @Post("/")
  async importWeapons(
    @BodyParams() body: unknown,
    @MultipartFile("file") file?: PlatformMulterFile,
  ) {
    const toValidateBody = file ? parseImportFile(file) : body;
    const data = validateSchema(WEAPON_SCHEMA_ARR, toValidateBody);

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
}
