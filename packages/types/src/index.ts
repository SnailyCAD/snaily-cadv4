import type { Permissions } from "@snailycad/permissions";
import type * as Prisma from "@prisma/client";

type CADPick =
  | "id"
  | "name"
  | "areaOfPlay"
  | "maxPlateLength"
  | "towWhitelisted"
  | "taxiWhitelisted"
  | "whitelisted"
  | "businessWhitelisted"
  | "features"
  | "autoSetUserProperties"
  | "registrationCode"
  | "steamApiKey"
  | "apiTokenId"
  | "apiToken"
  | "miscCadSettings"
  | "miscCadSettingsId"
  | "logoId"
  | "discordRoles"
  | "discordRolesId"
  | "version"
  | "autoSetUserProperties"
  | "autoSetUserPropertiesId";

export type cad = Pick<
  Omit<Prisma.cad, "registrationCode"> & {
    features: CadFeature[];
    miscCadSettings: MiscCadSettings | null;
    apiToken?: ApiToken | null;
    autoSetUserProperties?: AutoSetUserProperties | null;
    discordRoles?: DiscordRoles | null | undefined;
    version?: CADVersion | null;
    registrationCode?: string | boolean | null;
  },
  CADPick
>;

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
  | "hasTempPassword"
  | "roles";

export type User = Pick<
  Prisma.User & {
    apiToken: Prisma.ApiToken | null;
    soundSettings: Prisma.UserSoundSettings | null;
    twoFactorEnabled?: boolean;
    hasTempPassword?: boolean;
    roles?: CustomRole[];
  },
  UserPicks
>;

export type User2FA = Prisma.User2FA;

export type UserSoundSettings = Prisma.UserSoundSettings;

export type BaseCitizen = Prisma.Citizen;
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
  createdBy?: Officer | null;
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
  activeIncident?: Prisma.LeoIncident | null;
  callsigns?: IndividualDivisionCallsign[];
};

export type IndividualDivisionCallsign = Prisma.IndividualDivisionCallsign;

export type UnitQualification = Prisma.UnitQualification & {
  qualification: QualificationValue;
};

export type QualificationValue = Prisma.QualificationValue & {
  value: Prisma.Value;
  departments?: DepartmentValue[];
};

export type LeoWhitelistStatus = Prisma.LeoWhitelistStatus & {
  status: Prisma.WhitelistStatus;
  department: DepartmentValue;
};

export type StatusValue = Prisma.StatusValue & {
  value: Prisma.Value;
  departments?: DepartmentValue[];
};

export type OfficerLog = Prisma.OfficerLog;

export type ImpoundedVehicle = Prisma.ImpoundedVehicle & {
  vehicle: Prisma.RegisteredVehicle & { model: VehicleValue };
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
  officers: Omit<Officer, "activeIncident">[];
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
  unit?: Officer | CombinedLeoUnit | EmsFdDeputy;
};

export type AssignedWarrantOfficer = Prisma.AssignedWarrantOfficer & {
  unit: Officer | CombinedLeoUnit;
};

export type IncidentInvolvedUnit = Prisma.IncidentInvolvedUnit & {
  unit?: Officer | CombinedLeoUnit | EmsFdDeputy;
};

export type Call911Event = Prisma.Call911Event;

export type Bolo = Prisma.Bolo & {
  officer: Officer | null;
};

export type Record = Prisma.Record & {
  officer: Officer;
  violations: Violation[];
  seizedItems?: Prisma.SeizedItem[];
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
  citizen: Prisma.Citizen;
  license: Prisma.Value;
  categories?: DriversLicenseCategoryValue[];
};

export type WeaponExam = DLExam;

export type CustomField = Prisma.CustomField;

export type CustomFieldValue = Prisma.CustomFieldValue & {
  field: CustomField;
};

export type CustomRole = Prisma.CustomRole;

export type CourthousePost = Prisma.CourthousePost & {
  user: User;
};

export type ValueWithValueObj =
  | VehicleValue
  | WeaponValue
  | StatusValue
  | DepartmentValue
  | DivisionValue
  | EmployeeValue
  | DriversLicenseCategoryValue
  | QualificationValue
  | CallTypeValue;

export type AnyValue = Value | PenalCode | ValueWithValueObj;

/**
 * enums
 */
export const Feature = {
  BLEETER: "BLEETER",
  TOW: "TOW",
  TAXI: "TAXI",
  COURTHOUSE: "COURTHOUSE",
  TRUCK_LOGS: "TRUCK_LOGS",
  AOP: "AOP",
  BUSINESS: "BUSINESS",
  ALLOW_DUPLICATE_CITIZEN_NAMES: "ALLOW_DUPLICATE_CITIZEN_NAMES",
  DISCORD_AUTH: "DISCORD_AUTH",
  CALLS_911: "CALLS_911",
  WEAPON_REGISTRATION: "WEAPON_REGISTRATION",
  SOCIAL_SECURITY_NUMBERS: "SOCIAL_SECURITY_NUMBERS",
  CUSTOM_TEXTFIELD_VALUES: "CUSTOM_TEXTFIELD_VALUES",
  ACTIVE_DISPATCHERS: "ACTIVE_DISPATCHERS",
  ACTIVE_INCIDENTS: "ACTIVE_INCIDENTS",
  ALLOW_CITIZEN_UPDATE_LICENSE: "ALLOW_CITIZEN_UPDATE_LICENSE",
  ALLOW_REGULAR_LOGIN: "ALLOW_REGULAR_LOGIN",
  RADIO_CHANNEL_MANAGEMENT: "RADIO_CHANNEL_MANAGEMENT",
  ALLOW_CITIZEN_DELETION_BY_NON_ADMIN: "ALLOW_CITIZEN_DELETION_BY_NON_ADMIN",
  DL_EXAMS: "DL_EXAMS",
  DMV: "DMV",
  BADGE_NUMBERS: "BADGE_NUMBERS",
  USER_API_TOKENS: "USER_API_TOKENS",
  CITIZEN_RECORD_APPROVAL: "CITIZEN_RECORD_APPROVAL",
  COMMON_CITIZEN_CARDS: "COMMON_CITIZEN_CARDS",
  STEAM_OAUTH: "STEAM_OAUTH",
  CREATE_USER_CITIZEN_LEO: "CREATE_USER_CITIZEN_LEO",
  LEO_TICKETS: "LEO_TICKETS",
  LEO_BAIL: "LEO_BAIL",
  COURTHOUSE_POSTS: "COURTHOUSE_POSTS",
  WEAPON_EXAMS: "WEAPON_EXAMS",
  ACTIVE_WARRANTS: "ACTIVE_WARRANTS",
} as const;

export type Feature = typeof Feature[keyof typeof Feature];

export {
  RecordType,
  WhitelistStatus,
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
