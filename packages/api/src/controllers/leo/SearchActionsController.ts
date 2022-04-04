import { Controller } from "@tsed/di";
import {
  LICENSE_SCHEMA,
  LEO_VEHICLE_LICENSE_SCHEMA,
  LEO_CUSTOM_FIELDS_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses";
import type { VehicleInspectionStatus, VehicleTaxStatus } from "@prisma/client";
import { UseBeforeEach } from "@tsed/common";
import { Description, Put } from "@tsed/schema";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { validateSchema } from "lib/validateSchema";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";

@Controller("/search/actions")
@UseBeforeEach(IsAuth)
export class SearchActionsController {
  @Put("/licenses/:citizenId")
  @Description("Update the licenses for a citizen by their id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCitizenLicenses(
    @BodyParams() body: unknown,
    @PathParams("citizenId") citizenId: string,
  ) {
    const data = validateSchema(LICENSE_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    await updateCitizenLicenseCategories(citizen, data);

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        driversLicenseId: data.driversLicense,
        pilotLicenseId: data.pilotLicense,
        weaponLicenseId: data.weaponLicense,
        waterLicenseId: data.waterLicense,
      },
      include: citizenInclude,
    });

    return updated;
  }

  @Put("/vehicle-licenses/:vehicleId")
  @Description("Update the licenses of a vehicle by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateVehicleLicenses(
    @BodyParams() body: unknown,
    @PathParams("vehicleId") vehicleId: string,
  ) {
    const data = validateSchema(LEO_VEHICLE_LICENSE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        registrationStatusId: data.registrationStatus,
        insuranceStatusId: data.insuranceStatus,
        taxStatus: data.taxStatus as VehicleTaxStatus | null,
        inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
      },
    });

    return updated;
  }

  @Put("/vehicle-flags/:vehicleId")
  @Description("Update the vehicle flags by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateVehicleFlags(
    @BodyParams("flags") flags: string[],
    @PathParams("vehicleId") vehicleId: string,
  ) {
    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, flags: true },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      vehicle.flags.map((v) => v.id),
      flags,
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.registeredVehicle.update({ where: { id: vehicle.id }, data: { flags: v } }),
      ),
    );

    const updated = await prisma.registeredVehicle.findUnique({
      where: { id: vehicle.id },
      select: { id: true, flags: true },
    });

    return updated;
  }

  @Put("/citizen-flags/:citizenId")
  @Description("Update the citizens flags by their id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCitizenFlags(
    @BodyParams("flags") flags: string[],
    @PathParams("citizenId") citizenId: string,
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { id: true, flags: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      citizen.flags.map((v) => v.id),
      flags,
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.citizen.update({ where: { id: citizen.id }, data: { flags: v } }),
      ),
    );

    const updated = await prisma.citizen.findUnique({
      where: { id: citizen.id },
      select: { id: true, flags: true },
    });

    return updated;
  }

  @Put("/custom-fields/:citizenId")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCitizenCustomFields(
    @BodyParams("fields") fields: unknown,
    @PathParams("citizenId") citizenId: string,
  ) {
    const data = validateSchema(LEO_CUSTOM_FIELDS_SCHEMA, fields);

    console.log({ data });

    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { id: true, flags: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const createdFields = [];
    for (const fieldName in data) {
      const fieldData = data[fieldName];

      if (!fieldData) {
        continue;
      }

      const customField = await prisma.customField.findUnique({
        where: { id: fieldData?.fieldId },
      });

      if (!customField) {
        continue;
      }

      const createUpdateData = {
        value: fieldData.value ?? null,
        fieldId: customField.id,
      };

      const created = await prisma.customFieldValue.upsert({
        where: {
          id: String(fieldData.valueId),
        },
        create: createUpdateData,
        update: createUpdateData,
        include: { field: true },
      });

      createdFields.push(created);
    }

    const updated = getLastOfArray(
      await prisma.$transaction(
        createdFields.map((field) =>
          prisma.citizen.update({
            where: { id: citizen.id },
            data: { customFields: { connect: { id: field.id } } },
            include: { customFields: { include: { field: true } } },
          }),
        ),
      ),
    );

    return updated;
  }
}
