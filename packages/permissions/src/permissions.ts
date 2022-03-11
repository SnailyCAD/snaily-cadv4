export enum Permissions {
  // << 10 = leo
  ViewIncidents = 1 << 10,
  ManageIncidents = 1 << 11,
  ViewImpoundLot = 1 << 12,
  ManageImpoundLot = 1 << 13,
  ViewJail = 1 << 14,
  ManageJail = 1 << 15,
  ViewCallHistory = 1 << 16,
  ManageCallHistory = 1 << 17,

  // << 80 = admin
  ViewUsers = 1 << 80,
  ManageUsers = 1 << 81,
  BanUsers = 1 << 88,
  DeleteUsers = 1 << 84,

  ViewCitizens = 1 << 85,
  ManageCitizens = 1 << 86,
  DeleteCitizens = 1 << 87,

  ViewUnits = 1 << 88,
  ManageUnits = 1 << 89,
  DeleteUnits = 1 << 90,

  ViewBusinesses = 1 << 91,
  ManageBusinesses = 1 << 92,
  DeleteBusinesses = 1 << 93,

  ManageValueLicense = 1 << 120,
  ManageValueGender = 1 << 121,
  ManageValueEthnicity = 1 << 122,
  ManageValueVehicle = 1 << 123,
  ManageValueWeapon = 1 << 124,
  ManageValueBloodGroup = 1 << 125,
  ManageValueBusinessRole = 1 << 126,
  ManageValueCodes10 = 1 << 127,
  // use different digits here
  ManageValuePenalCode = 1 << 128,
  ManageValueDepartment = 1 << 129,
  ManageValueOfficerRank = 1 << 130,
  ManageValueDivision = 1 << 131,
  ManageValueDLCategory = 1 << 132,
  ManageValueImpoundLot = 1 << 133,
  ManageValueVehicleFlag = 1 << 134,
  ManageValueCitizenFlag = 1 << 135,
}

export const allPermissions = Object.values(Permissions).reduce((ac, cv) => (ac |= +cv), 0);
