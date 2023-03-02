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
  | ({ name: "divisionValue" } & Prisma.DivisionValueFindManyArgs)
  | ({ name: "qualificationValue" } & Prisma.QualificationValueFindManyArgs)
  | ({ name: "callTypeValue" } & Prisma.CallTypeValueFindManyArgs)
  | ({ name: "addressValue" } & Prisma.AddressValueFindManyArgs)
  | ({ name: "emergencyVehicleValue" } & Prisma.EmergencyVehicleValueFindManyArgs);

export const permissionsForRouteType: Record<ValueType, Permissions[]> = {
  ADDRESS: [Permissions.ManageValueAddress],
  ADDRESS_FLAG: [Permissions.ManageValueAddressFlag],
  BLOOD_GROUP: [Permissions.ManageValueBloodGroup],
  BUSINESS_ROLE: [Permissions.ManageValueBusinessRole],
  CITIZEN_FLAG: [Permissions.ManageValueCitizenFlag],
  CODES_10: [Permissions.ManageValueCodes10],
  DEPARTMENT: [Permissions.ManageValueDepartment],
  DIVISION: [Permissions.ManageValueDivision],
  DRIVERSLICENSE_CATEGORY: [Permissions.ManageValueDLCategory],
  EMERGENCY_VEHICLE: [Permissions.ManageValueEmergencyVehicle],
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
  CALL_TYPE: [Permissions.ManageValueCallType],
  VEHICLE_TRIM_LEVEL: [Permissions.ManageValueVehicleTrimLevel],
};

export function getTypeFromPath(path: string & {}) {
  return path.replace(/-/g, "_").toUpperCase() as ValueType;
}

export function getPermissionsForValuesRequest(request: Req) {
  const path = request.params.path;

  if (!path) {
    throw new BadRequest("Must specify `params.path`");
  }

  const type = getTypeFromPath(path) as ValueType | "ALL";
  if (type === "ALL") {
    return {
      permissions: Object.values(permissionsForRouteType).flat(1),
      fallback: (u: User) => u.rank !== Rank.USER,
    };
  }

  return {
    permissions: permissionsForRouteType[type],
    fallback: (u: User) => u.rank !== Rank.USER,
  };
}
