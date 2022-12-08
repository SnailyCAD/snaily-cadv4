import { Permissions } from "../permissions";

export const defaultLeoPermissions = [
  Permissions.Leo,
  Permissions.ViewIncidents,
  Permissions.ManageIncidents,
  Permissions.ViewImpoundLot,
  Permissions.ManageImpoundLot,
  Permissions.ViewJail,
  Permissions.ManageJail,
  Permissions.ViewCallHistory,
  Permissions.ManageCallHistory,
  Permissions.ViewDLExams,
  Permissions.ManageDLExams,
  Permissions.ViewWeaponExams,
  Permissions.ManageWeaponExams,
  Permissions.ViewLicenseExams,
  Permissions.ManageLicenseExams,
  Permissions.ManageDMV,
  Permissions.ManageBureauOfFirearms,
  Permissions.DeleteCitizenRecords,
  Permissions.ViewCitizenLogs,
  Permissions.ManageWarrants,
  Permissions.ManageAwardsAndQualifications,
];

export const defaultDispatchPermissions = [Permissions.Dispatch, Permissions.LiveMap];

export const defaultEmsFdPermissions = [Permissions.EmsFd];
