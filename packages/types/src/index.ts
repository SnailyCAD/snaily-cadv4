import type { Permissions } from "@snailycad/permissions";
import type * as Prisma from "@prisma/client";

export type cad = Prisma.cad & {
  features: CadFeature[];
  miscCadSettings: MiscCadSettings | null;
  apiToken?: ApiToken | null;
  autoSetUserProperties: AutoSetUserProperties | null;
  discordRoles: DiscordRoles | null;
  version: CADVersion | null;
};

interface CADVersion {
  currentCommitHash: string;
  currentVersion: string;
}

export type CadFeature = Prisma.CadFeature;

export type MiscCadSettings = Prisma.MiscCadSettings & {
  webhooks?: DiscordWebhook[];
};

export type DiscordWebhook = Prisma.DiscordWebhook;

export type AutoSetUserProperties = Prisma.AutoSetUserProperties;

export type ApiToken = Prisma.ApiToken & {
  logs?: ApiTokenLog[];
};

export type ApiTokenLog = Prisma.ApiTokenLog;

export type DiscordRoles = Prisma.DiscordRoles & {
  leoRoles?: DiscordRole[];
  emsFdRoles?: DiscordRole[];
  dispatchRoles?: DiscordRole[];
  leoSupervisorRoles?: DiscordRole[];
  towRoles?: DiscordRole[];
  taxiRoles?: DiscordRole[];
  courthouseRoles?: DiscordRole[];
  adminRole: DiscordRole | null;
  whitelistedRole: DiscordRole | null;
  roles?: DiscordRole[];

  adminRolePermissions: Permissions[];
  leoRolePermissions: Permissions[];
  leoSupervisorRolePermissions: Permissions[];
  emsFdRolePermissions: Permissions[];
  dispatchRolePermissions: Permissions[];
  towRolePermissions: Permissions[];
  taxiRolePermissions: Permissions[];
  courthouseRolePermissions: Permissions[];
};

export type DiscordRole = Prisma.DiscordRole;

type UserPicks =
  | "id"
  | "username"
  | "rank"
  | "isLeo"
  | "isSupervisor"
  | "isEmsFd"
  | "isDispatch"
  | "isTow"
  | "isTaxi"
  | "banned"
  | "banReason"
  | "avatarUrl"
  | "steamId"
  | "whitelistStatus"
  | "isDarkTheme"
  | "tempPassword"
  | "statusViewMode"
  | "discordId"
  | "tableActionsAlignment"
  | "lastDiscordSyncTimestamp"
  | "soundSettingsId"
  | "soundSettings"
  | "permissions"
  | "apiToken"
  | "apiTokenId"
  | "locale"
  | "twoFactorEnabled"
  | "hasTempPassword";

export type User = Pick<
  Prisma.User & {
    apiToken: Prisma.ApiToken | null;
    soundSettings: Prisma.UserSoundSettings | null;
    twoFactorEnabled?: boolean;
    hasTempPassword?: boolean;
  },
  UserPicks
>;

export type User2FA = Prisma.User2FA;

export type UserSoundSettings = Prisma.UserSoundSettings;

export type Citizen = Prisma.Citizen & {
  gender: Prisma.Value;
  ethnicity: Prisma.Value;
  driversLicense: Prisma.Value | null;
  weaponLicense: Prisma.Value | null;
  pilotLicense: Prisma.Value | null;
  waterLicense: Prisma.Value | null;
  dlCategory: (Prisma.DriversLicenseCategoryValue & { value: Prisma.Value })[];
  flags?: Prisma.Value[];
  notes?: Prisma.Note[];
};

export type Note = Prisma.Note & {
  createdBy: Officer | null;
};

export type RegisteredVehicle = Prisma.RegisteredVehicle & {
  citizen: Prisma.Citizen;
  model: VehicleValue;
  registrationStatus: Prisma.Value;
  insuranceStatus?: Prisma.Value | null;
  flags?: Prisma.Value[];
  notes?: Prisma.Note[];
  TruckLogs?: TruckLog[];
  Business?: Business[];
};

export type Weapon = Prisma.Weapon & {
  model: Prisma.WeaponValue & { value: Prisma.Value };
  citizen: Prisma.Citizen;
  registrationStatus: Prisma.Value;
};

export type MedicalRecord = Prisma.MedicalRecord & {
  bloodGroup: Prisma.Value | null;
};

export type Value = Prisma.Value & {
  officerRankDepartments?: DepartmentValue[];
};

export type PenalCode = Prisma.PenalCode & {
  warningApplicable?: WarningApplicable | null;
  warningNotApplicable?: WarningNotApplicable | null;
};

export type PenalCodeGroup = Prisma.PenalCodeGroup;

export type WarningApplicable = Prisma.WarningApplicable;

export type WarningNotApplicable = Prisma.WarningNotApplicable;

export type Violation = Prisma.Violation & {
  penalCode: PenalCode;
};

export type SeizedItem = Prisma.SeizedItem;

export type DivisionValue = Prisma.DivisionValue & { value: Prisma.Value };

export type CallTypeValue = Prisma.CallTypeValue & { value: Prisma.Value };

export type DepartmentValue = Prisma.DepartmentValue & { value: Prisma.Value };

export type DriversLicenseCategoryValue = Prisma.DriversLicenseCategoryValue & {
  value: Prisma.Value;
};

export type VehicleValue = Prisma.VehicleValue & { value: Prisma.Value };

export type WeaponValue = Prisma.WeaponValue & { value: Prisma.Value };

export type Notification = Prisma.Notification;

export type BleeterPost = Prisma.BleeterPost;

export type TowCall = Prisma.TowCall & {
  assignedUnit: Pick<Prisma.Citizen, "name" | "surname" | "id"> | null;
  creator: Pick<Prisma.Citizen, "name" | "surname" | "id"> | null;
};

export type TaxiCall = Prisma.TaxiCall & {
  assignedUnit: Pick<Prisma.Citizen, "name" | "surname" | "id"> | null;
  creator: Pick<Prisma.Citizen, "name" | "surname" | "id"> | null;
};

export type Business = Prisma.Business;

export type Employee = Prisma.Employee & {
  citizen: Pick<Prisma.Citizen, "name" | "surname" | "id">;
  role: EmployeeValue | null;
};

export type BusinessPost = Prisma.BusinessPost;

export type EmployeeValue = Prisma.EmployeeValue & {
  value: Prisma.Value;
  as: Prisma.EmployeeAsEnum;
};

export type Officer = Prisma.Officer & {
  department: DepartmentValue | null;
  divisions: DivisionValue[];
  activeDivisionCallsign: Prisma.IndividualDivisionCallsign | null;
  status: StatusValue | null;
  citizen: Pick<Prisma.Citizen, "name" | "surname" | "id">;
  whitelistStatus?: (Prisma.LeoWhitelistStatus & { department: Officer["department"] }) | null;
  user: User;
  rank: Prisma.Value | null;
  activeIncident: Prisma.LeoIncident | null;
  callsigns?: IndividualDivisionCallsign[];
};

export type IndividualDivisionCallsign = Prisma.IndividualDivisionCallsign;

export type UnitQualification = Prisma.UnitQualification & {
  qualification: QualificationValue;
};

export type QualificationValue = Prisma.QualificationValue & {
  value: Prisma.Value;
  departments: DepartmentValue[];
};

export type LeoWhitelistStatus = Prisma.LeoWhitelistStatus & {
  status: Prisma.WhitelistStatus;
  department: DepartmentValue;
};

export type StatusValue = Prisma.StatusValue & { value: Prisma.Value };

export type OfficerLog = Prisma.OfficerLog;

export type ImpoundedVehicle = Prisma.ImpoundedVehicle & {
  vehicle: RegisteredVehicle;
  location: Prisma.Value;
};

export type LeoIncident = Prisma.LeoIncident & {
  creator?: Officer | null;
  situationCode: StatusValue | null;
  events?: IncidentEvent[];
  unitsInvolved: IncidentInvolvedUnit[];
};

export type IncidentEvent = Prisma.IncidentEvent;

export type CombinedLeoUnit = Prisma.CombinedLeoUnit & {
  status: Officer["status"];
  department: Officer["department"];
  officers: Officer[];
};

export type ActiveDispatchers = Prisma.ActiveDispatchers;

export type Call911 = Prisma.Call911 & {
  position: Position | null;
  situationCode: StatusValue | null;
  departments?: DepartmentValue[];
  divisions?: DivisionValue[];
  incidents?: LeoIncident[];
  viaDispatch: boolean | null;
  type: CallTypeValue | null;
};

export type Position = Prisma.Position;

export type AssignedUnit = Prisma.AssignedUnit & {
  unit: Officer | CombinedLeoUnit | EmsFdDeputy;
};

export type IncidentInvolvedUnit = Prisma.IncidentInvolvedUnit & {
  unit: Officer | CombinedLeoUnit | EmsFdDeputy;
};

export type Call911Event = Prisma.Call911Event;

export type Bolo = Prisma.Bolo & {
  officer: Officer | null;
};

export type Record = Prisma.Record & {
  officer: Officer;
  violations: Violation[];
  seizedItems: Prisma.SeizedItem[];
};

export type RecordRelease = Prisma.RecordRelease & {
  releasedBy: Citizen | null;
};

export type Warrant = Prisma.Warrant & {
  officer?: Officer;
};

export type RecordLog = Prisma.RecordLog & {
  records: Record | null;
  warrant: Warrant | null;
};

export type ExpungementRequest = Prisma.ExpungementRequest;

export type NameChangeRequest = Prisma.NameChangeRequest & {
  citizen: Citizen;
};

export type CourtEntry = Prisma.CourtEntry & {
  dates?: CourtDate[];
};

export type CourtDate = Prisma.CourtDate;

export type EmsFdDeputy = Prisma.EmsFdDeputy & {
  department: Officer["department"];
  division: Officer["divisions"][number];
  rank: Officer["rank"];
  status: Officer["status"];
  citizen: Officer["citizen"];
  user: Officer["user"];
  whitelistStatus?: Officer["whitelistStatus"];
};

export type TruckLog = Prisma.TruckLog & {
  citizen: Prisma.Citizen | null;
  vehicle: RegisteredVehicle | null;
};

export type DLExam = Prisma.DLExam & {
  citizen: Citizen;
  license: Prisma.Value;
  categories?: DriversLicenseCategoryValue[];
};

export type WeaponExam = DLExam;

export type CustomField = Prisma.CustomField;

export type CustomFieldValue = Prisma.CustomFieldValue & {
  field: CustomField;
};

export type CourthousePost = Prisma.CourthousePost & {
  user: User;
};

/**
 * enums
 */

export {
  RecordType,
  WhitelistStatus,
  Feature,
  Rank,
  StatusViewMode,
  TableActionsAlignment,
  ValueType,
  ValueLicenseType,
  DepartmentType,
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  ShouldDoType,
  StatusValueType,
  WhatPages,
  BoloType,
  ReleaseType,
  ExpungementRequestStatus,
  WarrantStatus,
  VehicleInspectionStatus,
  VehicleTaxStatus,
  DLExamPassType,
  DLExamStatus,
  CustomFieldCategory,
  QualificationValueType,
  DiscordWebhookType,
  JailTimeScale,
} from "@prisma/client";
