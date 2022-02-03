import { Controller } from "@tsed/di";
import { Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { BodyParams, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { IMPORT_CITIZENS_ARR } from "@snailycad/schemas";

@Controller("/admin/import/citizens")
export class ImportCitizensController {
  @Post("/")
  async importCitizens(
    @BodyParams() body: unknown,
    @MultipartFile("file") file?: PlatformMulterFile,
  ) {
    const toValidateBody = file ? parseImportFile(file) : body;
    const data = validateSchema(IMPORT_CITIZENS_ARR, toValidateBody);

    return Promise.all(
      data.map(async (data) => {
        return prisma.citizen.create({
          data: {
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
            socialSecurityNumber: generateString(9, { numbersOnly: true }),
          },
          include: { gender: true, ethnicity: true },
        });
      }),
    );
  }
}
