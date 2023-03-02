import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { Feature, ValueType } from "@snailycad/types";

export interface SidebarRoute {
  permissions: Permissions[];
  type: ValueType | string;
  hidden?(features: Record<Feature, boolean>): boolean;
}

export const managementRoutes: SidebarRoute[] = [
  {
    type: "USERS",
    permissions: [
      Permissions.ViewUsers,
      Permissions.ManageUsers,
      Permissions.BanUsers,
      Permissions.DeleteUsers,
    ],
  },
  {
    type: "CITIZENS",
    permissions: [Permissions.ViewCitizens, Permissions.ManageCitizens, Permissions.DeleteCitizens],
  },
  {
    type: "UNITS",
    permissions: [
      Permissions.ViewUnits,
      Permissions.ManageUnits,
      Permissions.DeleteUnits,
      Permissions.ManageUnitCallsigns,
      Permissions.ManageAwardsAndQualifications,
    ],
  },
  {
    type: "BUSINESSES",
    permissions: [
      Permissions.ViewBusinesses,
      Permissions.ManageBusinesses,
      Permissions.DeleteBusinesses,
    ],
    hidden: ({ BUSINESS }) => !BUSINESS,
  },
  {
    type: "COURTHOUSE",
    permissions: defaultPermissions.defaultCourthousePermissions,
    hidden: ({ COURTHOUSE }) => !COURTHOUSE,
  },
  {
    type: "CUSTOM_FIELDS",
    permissions: [Permissions.ViewCustomFields, Permissions.ManageCustomFields],
  },
  {
    type: "CUSTOM_ROLES",
    permissions: [Permissions.ViewCustomRoles, Permissions.ManageCustomRoles],
  },
  {
    type: "AUDIT_LOGS",
    permissions: defaultPermissions.allDefaultAdminPermissions,
  },
];

export const valueRoutes: SidebarRoute[] = [
  {
    type: ValueType.ADDRESS,
    permissions: [Permissions.ManageValueAddress],
  },
  {
    type: ValueType.ADDRESS_FLAG,
    permissions: [Permissions.ManageValueAddressFlag],
  },
  {
    type: ValueType.BLOOD_GROUP,
    permissions: [Permissions.ManageValueBloodGroup],
  },
  {
    type: ValueType.BUSINESS_ROLE,
    permissions: [Permissions.ManageValueBusinessRole],
    hidden: ({ BUSINESS }) => !BUSINESS,
  },
  {
    type: ValueType.CALL_TYPE,
    permissions: [Permissions.ManageValueCallType],
    hidden: ({ CALLS_911 }) => !CALLS_911,
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
    hidden: ({ DIVISIONS }) => !DIVISIONS,
  },
  {
    type: ValueType.DRIVERSLICENSE_CATEGORY,
    permissions: [Permissions.ManageValueDLCategory],
  },
  {
    type: ValueType.EMERGENCY_VEHICLE,
    permissions: [Permissions.ManageValueEmergencyVehicle],
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
    type: ValueType.QUALIFICATION,
    permissions: [Permissions.ManageValueQualification],
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
    type: ValueType.VEHICLE_TRIM_LEVEL,
    permissions: [Permissions.ManageValueVehicleTrimLevel],
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
