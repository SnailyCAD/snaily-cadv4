import type { Prisma, PrismaClient } from "@prisma/client";

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
