export enum Permissions {
  // << 20 = admin
  ViewUsers = 1 << 20,
  ManageUsers = 1 << 21,
  BanUsers = 1 << 22,
  DeleteUsers = 1 << 24,

  ViewCitizens = 1 << 25,
  ManageCitizens = 1 << 26,
  DeleteCitizens = 1 << 27,

  ViewUnits = 1 << 28,
  ManageUnits = 1 << 29,
  DeleteUnits = 1 << 30,

  ViewBusinesses = 1 << 31,
  ManageBusinesses = 1 << 32,
  DeleteBusinesses = 1 << 33,
}

export const allPermissions = Object.values(Permissions).reduce((ac, cv) => (ac |= +cv), 0);
