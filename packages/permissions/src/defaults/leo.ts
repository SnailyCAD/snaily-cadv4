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
  Permissions.ManageDMV,
];

export const defaultDispatchPermissions = [Permissions.Dispatch, Permissions.LiveMap];

export const defaultEmsFdPermissions = [Permissions.EmsFd];
