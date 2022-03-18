import { Permissions } from "@snailycad/permissions";
import { Feature, ValueType } from "@snailycad/types";

export interface SidebarRoute {
  permissions: Permissions[];
  type: ValueType | string;
  hidden?(features: Record<Feature, boolean>): boolean;
}

export const valueRoutes: SidebarRoute[] = [
  {
    type: ValueType.BLOOD_GROUP,
    permissions: [Permissions.ManageValueBloodGroup],
  },
  {
    type: ValueType.BUSINESS_ROLE,
    permissions: [Permissions.ManageValueBusinessRole],
  },
  {
    type: ValueType.CITIZEN_FLAG,
    permissions: [Permissions.ManageValueCitizenFlag],
  },
  {
    type: ValueType.CODES_10,
    permissions: [Permissions.ManageValueCodes10],
  },
  {
    type: ValueType.DEPARTMENT,
    permissions: [Permissions.ManageValueDepartment],
  },
  {
    type: ValueType.DIVISION,
    permissions: [Permissions.ManageValueDivision],
  },
  {
    type: ValueType.DRIVERSLICENSE_CATEGORY,
    permissions: [Permissions.ManageValueDLCategory],
  },
  {
    type: ValueType.ETHNICITY,
    permissions: [Permissions.ManageValueEthnicity],
  },
  {
    type: ValueType.GENDER,
    permissions: [Permissions.ManageValueGender],
  },
  {
    type: ValueType.IMPOUND_LOT,
    permissions: [Permissions.ManageValueImpoundLot],
  },
  {
    type: ValueType.LICENSE,
    permissions: [Permissions.ManageValueLicense],
  },
  {
    type: ValueType.OFFICER_RANK,
    permissions: [Permissions.ManageValueOfficerRank],
  },
  {
    type: ValueType.PENAL_CODE,
    permissions: [Permissions.ManageValuePenalCode],
  },
  {
    type: ValueType.VEHICLE,
    permissions: [Permissions.ManageValueVehicle],
  },
  {
    type: ValueType.VEHICLE_FLAG,
    permissions: [Permissions.ManageValueVehicleFlag],
  },
  {
    type: ValueType.WEAPON,
    permissions: [Permissions.ManageValueWeapon],
    hidden: ({ WEAPON_REGISTRATION }) => !WEAPON_REGISTRATION,
  },
];

export const importRoutes: SidebarRoute[] = [
  {
    permissions: [Permissions.ImportCitizens],
    type: "CITIZENS",
  },
  {
    permissions: [Permissions.ImportRegisteredVehicles],
    type: "VEHICLES",
  },
  {
    permissions: [Permissions.ImportRegisteredWeapons],
    type: "WEAPONS",
    hidden: ({ WEAPON_REGISTRATION }) => !WEAPON_REGISTRATION,
  },
];
