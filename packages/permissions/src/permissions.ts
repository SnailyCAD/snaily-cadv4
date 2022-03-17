export enum Permissions {
  // leo related
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

  //  citizen related
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
