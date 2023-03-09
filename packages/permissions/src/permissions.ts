export enum Permissions {
  // leo related
  Leo = "Leo",
  ViewIncidents = "ViewIncidents",
  ManageIncidents = "ManageIncidents",
  ViewImpoundLot = "ViewImpoundLot",
  ManageImpoundLot = "ManageImpoundLot",
  ViewJail = "ViewJail",
  ManageJail = "ManageJail",
  ViewCallHistory = "ViewCallHistory",
  ManageCallHistory = "ManageCallHistory",
  LiveMap = "LiveMap",
  ViewCitizenLogs = "ViewCitizenLogs",
  ViewLicenseExams = "ViewLicenseExams",
  ManageLicenseExams = "ManageLicenseExams",

  ViewCustomFields = "ViewCustomFields",
  ManageCustomFields = "ManageCustomFields",
  ManageDMV = "ManageDMV",
  ManageBureauOfFirearms = "ManageBureauOfFirearms",
  DeleteCitizenRecords = "DeleteCitizenRecords",
  ManageCustomRoles = "ManageCustomRoles",
  ViewCustomRoles = "ViewCustomRoles",
  ManageWarrants = "ManageWarrants",
  ManageAwardsAndQualifications = "ManageAwardsAndQualifications",

  Dispatch = "Dispatch",

  // ems-fd
  EmsFd = "EmsFd",
  ViewEmsFdIncidents = "ViewEmsFdIncidents",
  ManageEmsFdIncidents = "ManageEmsFdIncidents",

  //  citizen related
  ViewTaxiCalls = "ViewTaxiCalls",
  ManageTaxiCalls = "ManageTaxiCalls",

  ViewTowCalls = "ViewTowCalls",
  ManageTowCalls = "ManageTowCalls",
  ViewTowLogs = "ViewTowLogs",

  CreateBusinesses = "CreateBusinesses",

  // admin related
  ManageCADSettings = "ManageCADSettings",

  ViewUsers = "ViewUsers",
  ManageUsers = "ManageUsers",
  BanUsers = "BanUsers",
  DeleteUsers = "DeleteUsers",

  ViewCitizens = "ViewCitizens",
  ManageCitizens = "ManageCitizens",
  DeleteCitizens = "DeleteCitizens",

  ViewUnits = "ViewUnits",
  ManageUnits = "ManageUnits",
  DeleteUnits = "DeleteUnits",
  ManageUnitCallsigns = "ManageUnitCallsigns",

  ViewBusinesses = "ViewBusinesses",
  ManageBusinesses = "ManageBusinesses",
  DeleteBusinesses = "DeleteBusinesses",

  ViewExpungementRequests = "ViewExpungementRequests",
  ManageExpungementRequests = "ManageExpungementRequests",

  ViewNameChangeRequests = "ViewNameChangeRequests",
  ManageNameChangeRequests = "ManageNameChangeRequests",

  ManagePendingWarrants = "ManagePendingWarrants",

  ManageCourthousePosts = "ManageCourthousePosts",

  ImportCitizens = "ImportCitizens",
  ImportRegisteredVehicles = "ImportRegisteredVehicles",
  ImportRegisteredWeapons = "ImportRegisteredWeapons",
  DeleteRegisteredVehicles = "DeleteRegisteredVehicles",
  DeleteRegisteredWeapons = "DeleteRegisteredWeapons",

  // values
  ManageValueLicense = "ManageValueLicense",
  ManageValueGender = "ManageValueGender",
  ManageValueEthnicity = "ManageValueEthnicity",
  ManageValueVehicle = "ManageValueVehicle",
  ManageValueWeapon = "ManageValueWeapon",
  ManageValueBloodGroup = "ManageValueBloodGroup",
  ManageValueBusinessRole = "ManageValueBusinessRole",
  ManageValueCodes10 = "ManageValueCodes10",
  ManageValuePenalCode = "ManageValuePenalCode",
  ManageValueDepartment = "ManageValueDepartment",
  ManageValueOfficerRank = "ManageValueOfficerRank",
  ManageValueDivision = "ManageValueDivision",
  ManageValueDLCategory = "ManageValueDLCategory",
  ManageValueImpoundLot = "ManageValueImpoundLot",
  ManageValueVehicleFlag = "ManageValueVehicleFlag",
  ManageValueCitizenFlag = "ManageValueCitizenFlag",
  ManageValueQualification = "ManageValueQualification",
  ManageValueCallType = "ManageValueCallType",
  ManageValueAddress = "ManageValueAddress",
  ManageValueEmergencyVehicle = "ManageValueEmergencyVehicle",
  ManageValueAddressFlag = "ManageValueAddressFlag",
  ManageValueVehicleTrimLevel = "ManageValueVehicleTrimLevel",

  // other
  UsePersonalApiToken = "UsePersonalApiToken",

  // deprecated

  ViewDLExams = "ViewDLExams",
  ManageDLExams = "ManageDLExams",
  ViewWeaponExams = "ViewWeaponExams",
  ManageWeaponExams = "ManageWeaponExams",
}

export const allPermissions = Object.values(Permissions);
