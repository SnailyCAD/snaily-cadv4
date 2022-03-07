import { Controller } from "@tsed/di";
import { Get, Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { VEHICLE_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/vehicles";
import { BodyParams, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { parseImportFile } from "utils/file";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { citizenInclude } from "controllers/citizen/CitizenController";
import type { RegisteredVehicle, VehicleInspectionStatus, VehicleTaxStatus } from "@prisma/client";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";

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
    return importVehiclesHandler(toValidateBody);
  }
}

export async function importVehiclesHandler(body: unknown[]) {
  const data = validateSchema(VEHICLE_SCHEMA_ARR, body);

  return Promise.all(
    data.map(async (data) => {
      const vehicle = await prisma.registeredVehicle.create({
        data: {
          citizenId: data.ownerId,
          plate: data.plate,
          color: data.color,
          registrationStatusId: data.registrationStatusId,
          modelId: data.modelId,
          vinNumber: generateString(17),
          reportedStolen: data.reportedStolen ?? false,
          inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
          taxStatus: data.taxStatus as VehicleTaxStatus | null,
          insuranceStatusId: data.insuranceStatus,
        },

        include: vehiclesInclude,
      });

      let last: RegisteredVehicle = vehicle;
      if (data.flags) {
        const disconnectConnectArr = manyToManyHelper([], data.flags);

        last = getLastOfArray(
          await prisma.$transaction(
            disconnectConnectArr.map((v, idx) =>
              prisma.registeredVehicle.update({
                where: { id: vehicle.id },
                data: { flags: v },
                include: idx + 1 === disconnectConnectArr.length ? vehiclesInclude : undefined,
              }),
            ),
          ),
        );
      }

      return last;
    }),
  );
}
