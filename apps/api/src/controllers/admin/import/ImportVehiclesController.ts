import { Controller } from "@tsed/di";
import { Get, Post, Description, Delete, ContentType } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { VEHICLE_SCHEMA_ARR } from "@snailycad/schemas/dist/admin/import/vehicles";
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
import type { Prisma, VehicleInspectionStatus, VehicleTaxStatus } from "@prisma/client";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";
import type * as APITypes from "@snailycad/types/api";

const vehiclesInclude = { ...citizenInclude.vehicles.include, citizen: true };

@Controller("/admin/import/vehicles")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class ImportVehiclesController {
  @Get("/")
  @Description("Get all the vehicles in the CAD (paginated)")
  async getVehicles(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetImportVehiclesData> {
    const where: Prisma.RegisteredVehicleWhereInput | undefined = query
      ? {
          OR: [
            { plate: { contains: query, mode: "insensitive" } },
            { model: { value: { value: { contains: query, mode: "insensitive" } } } },
            { color: { contains: query, mode: "insensitive" } },
            { vinNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined;

    const [totalCount, vehicles] = await prisma.$transaction([
      prisma.registeredVehicle.count({ where }),
      prisma.registeredVehicle.findMany({
        include: vehiclesInclude,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        where,
      }),
    ]);

    return { totalCount, vehicles };
  }

  @Post("/")
  @Description("Import vehicles in the CAD via body data")
  async importVehicles(@BodyParams() body: any): Promise<APITypes.PostImportVehiclesData> {
    return importVehiclesHandler(body);
  }

  @Post("/file")
  @Description("Import vehicles in the CAD via file upload")
  async importVehiclesViaFile(
    @MultipartFile("file") file: PlatformMulterFile,
  ): Promise<APITypes.PostImportVehiclesData> {
    const toValidateBody = parseImportFile(file);
    return importVehiclesHandler(toValidateBody);
  }

  @Delete("/:id")
  @Description("Delete a registered vehicle by its id")
  async deleteVehicle(@PathParams("id") id: string): Promise<APITypes.DeleteImportVehiclesData> {
    await prisma.registeredVehicle.delete({ where: { id } });

    return true;
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

      let last = vehicle;
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
        ) as typeof vehicle;
      }

      return last;
    }),
  );
}
