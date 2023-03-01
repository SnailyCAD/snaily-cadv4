import { Permissions } from "../permissions";

export const defaultManagementPermissions = [
  Permissions.ViewUsers,
  Permissions.ManageUsers,
  Permissions.BanUsers,
  Permissions.DeleteUsers,
  Permissions.ViewCitizens,
  Permissions.ManageCitizens,
  Permissions.DeleteCitizens,
  Permissions.ViewUnits,
  Permissions.ManageUnits,
  Permissions.DeleteUnits,
  Permissions.ManageUnitCallsigns,
  Permissions.ManageAwardsAndQualifications,
  Permissions.ViewBusinesses,
  Permissions.ManageBusinesses,
  Permissions.DeleteBusinesses,
  Permissions.ViewExpungementRequests,
  Permissions.ManageExpungementRequests,
  Permissions.ViewNameChangeRequests,
  Permissions.ManageNameChangeRequests,
  Permissions.ViewCustomFields,
  Permissions.ManageCustomFields,
  Permissions.ManageCustomRoles,
  Permissions.ViewCustomRoles,
];

export const defaultImportPermissions = [
  Permissions.ImportCitizens,
  Permissions.ImportRegisteredVehicles,
  Permissions.ImportRegisteredWeapons,
];

export const defaultValuePermissions = [
  Permissions.ManageValueLicense,
  Permissions.ManageValueGender,
  Permissions.ManageValueEthnicity,
  Permissions.ManageValueVehicle,
  Permissions.ManageValueWeapon,
  Permissions.ManageValueBloodGroup,
  Permissions.ManageValueBusinessRole,
  Permissions.ManageValueCodes10,
  Permissions.ManageValuePenalCode,
  Permissions.ManageValueDepartment,
  Permissions.ManageValueOfficerRank,
  Permissions.ManageValueDivision,
  Permissions.ManageValueDLCategory,
  Permissions.ManageValueImpoundLot,
  Permissions.ManageValueVehicleFlag,
  Permissions.ManageValueCitizenFlag,
  Permissions.ManageValueQualification,
  Permissions.ManageValueCallType,
  Permissions.ManageValueAddress,
  Permissions.ManageValueEmergencyVehicle,
  Permissions.ManageValueAddressFlag,
  Permissions.ManageValueVehicleTrimLevel,
];

export const defaultCourthousePermissions = [
  Permissions.ViewExpungementRequests,
  Permissions.ManageExpungementRequests,
  Permissions.ViewNameChangeRequests,
  Permissions.ManageNameChangeRequests,
  Permissions.ManagePendingWarrants,
  Permissions.ManageCourthousePosts,
];

export const defaultOwnerPermissions = [Permissions.ManageCADSettings];

export const allDefaultAdminPermissions = [
  ...defaultManagementPermissions,
  ...defaultImportPermissions,
  ...defaultValuePermissions,
  ...defaultOwnerPermissions,
];
