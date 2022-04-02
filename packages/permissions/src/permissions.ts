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
  ViewDLExams = "ViewDLExams",
  ManageDLExams = "ManageDLExams",
  ManageCustomFields = "ManageCustomFields",

  Dispatch = "Dispatch",
  EmsFd = "EmsFd",

  //  citizen related
  ViewTaxiCalls = "ViewTaxiCalls",
  ManageTaxiCalls = "ManageTaxiCalls",

  ViewTowCalls = "ViewTowCalls",
  ManageTowCalls = "ManageTowCalls",
  ViewTowLogs = "ViewTowLogs",

  // admin related
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

  ViewBusinesses = "ViewBusinesses",
  ManageBusinesses = "ManageBusinesses",
  DeleteBusinesses = "DeleteBusinesses",

  ViewExpungementRequests = "ViewExpungementRequests",
  ManageExpungementRequests = "ManageExpungementRequests",

  ViewNameChangeRequests = "ViewNameChangeRequests",
  ManageNameChangeRequests = "ManageNameChangeRequests",

  ImportCitizens = "ImportCitizens",
  ImportRegisteredVehicles = "ImportRegisteredVehicles",
  ImportRegisteredWeapons = "ImportRegisteredWeapons",

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
}

export const allPermissions = Object.values(Permissions);
