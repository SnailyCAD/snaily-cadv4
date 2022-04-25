import { Prisma, PrismaClient, Rank, ValueType, User } from "@prisma/client";
import { Permissions } from "@snailycad/permissions";
import type { Req } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";

export type NameType = Exclude<
  keyof PrismaClient,
  | "$use"
  | "$on"
  | "$connect"
  | "$disconnect"
  | "$executeRaw"
  | "$executeRawUnsafe"
  | "$queryRaw"
  | "$queryRawUnsafe"
  | "$transaction"
>;

export type ValuesSelect =
  | ({ name: "vehicleValue" } & Prisma.VehicleValueFindManyArgs)
  | ({ name: "weaponValue" } & Prisma.WeaponValueFindManyArgs)
  | ({ name: "employeeValue" } & Prisma.EmployeeValueFindManyArgs)
  | ({ name: "statusValue" } & Prisma.StatusValueFindManyArgs)
  | ({ name: "driversLicenseCategoryValue" } & Prisma.DriversLicenseCategoryValueFindManyArgs)
  | ({ name: "departmentValue" } & Prisma.DepartmentValueFindManyArgs)
  | ({ name: "divisionValue" } & Prisma.DivisionValueFindManyArgs);

export const permissionsForRouteType: Record<ValueType, Permissions[]> = {
  BLOOD_GROUP: [Permissions.ManageValueBloodGroup],
  BUSINESS_ROLE: [Permissions.ManageValueBusinessRole],
  CITIZEN_FLAG: [Permissions.ManageValueCitizenFlag],
  CODES_10: [Permissions.ManageValueCodes10],
  DEPARTMENT: [Permissions.ManageValueDepartment],
  DIVISION: [Permissions.ManageValueDivision],
  DRIVERSLICENSE_CATEGORY: [Permissions.ManageValueDLCategory],
  ETHNICITY: [Permissions.ManageValueEthnicity],
  GENDER: [Permissions.ManageValueGender],
  IMPOUND_LOT: [Permissions.ManageValueImpoundLot],
  LICENSE: [Permissions.ManageValueLicense],
  OFFICER_RANK: [Permissions.ManageValueOfficerRank],
  PENAL_CODE: [Permissions.ManageValuePenalCode],
  VEHICLE: [Permissions.ManageValueVehicle],
  VEHICLE_FLAG: [Permissions.ManageValueVehicleFlag],
  WEAPON: [Permissions.ManageValueWeapon],
  QUALIFICATION: [Permissions.ManageValueQualification],
};

export function getTypeFromPath(path: string) {
  return path.replace("-", "_").toUpperCase() as ValueType;
}

export function getPermissionsForValuesRequest(request: Req) {
  const path = request.params.path;
  if (!path) {
    throw new BadRequest("Must specify `params.path`");
  }

  const type = getTypeFromPath(path);
  return {
    permissions: permissionsForRouteType[type],
    fallback: (u: User) => u.rank !== Rank.USER,
  };
}
