import type { Prisma, PrismaClient, ValueType } from "@prisma/client";
import { Permissions } from "@snailycad/permissions";

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

// todo: use this
export const permissionsForRouteType: Record<ValueType, Permissions[]> = {
  LICENSE: [Permissions.ManageValueLicense],
};
