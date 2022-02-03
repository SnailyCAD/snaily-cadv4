import { Controller } from "@tsed/di";
import { Get, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { VEHICLE_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/vehicles";
import { BodyParams, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";

const vehiclesInclude = { ...citizenInclude.vehicles.include, citizen: true };

@Controller("/admin/import/vehicles")
export class ImportVehiclesController {
  @Get("")
  async getVehicles() {
    const vehicles = await prisma.registeredVehicle.findMany({ include: vehiclesInclude });
    return vehicles;
  }

  @Post("/")
  async importVehicles(
    @BodyParams() body: unknown,
    @MultipartFile("file") file?: PlatformMulterFile,
  ) {
    const toValidateBody = file ? parseImportFile(file) : body;
    const data = validateSchema(VEHICLE_SCHEMA_ARR, toValidateBody);

    return Promise.all(
      data.map(async (data) => {
        return prisma.registeredVehicle.create({
          data: {
            citizenId: data.ownerId,
            plate: data.plate,
            insuranceStatus: "null",
            color: data.color,
            registrationStatusId: data.registrationStatusId,
            modelId: data.modelId,
            vinNumber: generateString(17),
          },
          include: vehiclesInclude,
        });
      }),
    );
  }
}
