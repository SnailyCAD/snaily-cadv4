import type { Permissions } from "@snailycad/permissions";
import type * as Prisma from "./prisma/index";
import type * as Enums from "./enums";
import type { CadFeatureOptions } from "./lib/cad-feature";

export * from "./enums";
export * from "./lib/cad-feature";

type CADPick =
  | "id"
  | "name"
  | "areaOfPlay"
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
  | "autoSetUserPropertiesId"
  | "timeZone";

export type cad = Pick<
  Omit<Prisma.cad, "registrationCode"> & {
    features: Record<Enums.Feature, boolean> & { options?: CadFeatureOptions };
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
  latestReleaseVersion: string | null;
}

export type CadFeature = Prisma.CadFeature;
export type LiveMapURL = Prisma.LiveMapURL;

export type MiscCadSettings = Prisma.MiscCadSettings & {
  webhooks?: DiscordWebhook[];
  liveMapURLs?: Prisma.LiveMapURL[];
};

export type DiscordWebhook = Prisma.DiscordWebhook;

export type AutoSetUserProperties = Prisma.AutoSetUserProperties;

export type BlacklistedWord = Prisma.BlacklistedWord;

export type ApiToken = Prisma.ApiToken & {
  logs?: ApiTokenLog[];
};

export type ApiTokenLog = Prisma.ApiTokenLog;

export type DiscordRoles = Prisma.DiscordRoles & {
  adminRoles?: DiscordRole[];
  leoRoles?: DiscordRole[];
  emsFdRoles?: DiscordRole[];
  dispatchRoles?: DiscordRole[];
  leoSupervisorRoles?: DiscordRole[];
  towRoles?: DiscordRole[];
  taxiRoles?: DiscordRole[];
  courthouseRoles?: DiscordRole[];
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
  | "apiTokenId"
  | "locale"
  | "twoFactorEnabled"
  | "hasTempPassword"
  | "roles"
  | "lastSeen"
  | "hasPassword"
  | "developerMode"
  | "dispatchLayoutOrder"
  | "emsFdLayoutOrder"
  | "officerLayoutOrder";

export type User = Pick<
  Prisma.User & {
    soundSettings: Prisma.UserSoundSettings | null;
    twoFactorEnabled?: boolean;
    hasTempPassword?: boolean;
    hasPassword?: boolean;
    roles?: CustomRole[];
  },
  UserPicks
>;

export type LimitedUserPicks = "id" | "discordId" | "steamId" | "username";
export type LimitedUser = Pick<Prisma.User, LimitedUserPicks>;

export type User2FA = Prisma.User2FA;
export type UserSoundSettings = Prisma.UserSoundSettings;

export type BaseCitizen = Prisma.Citizen;
export type Citizen = Prisma.Citizen & {
  gender?: Prisma.Value | null;
  ethnicity?: Prisma.Value | null;
  driversLicense: Prisma.Value | null;
  weaponLicense: Prisma.Value | null;
  fishingLicense: Prisma.Value | null;
  huntingLicense: Prisma.Value | null;
  pilotLicense: Prisma.Value | null;
  waterLicense: Prisma.Value | null;
  dlCategory: (Prisma.DriversLicenseCategoryValue & { value: Value })[];
  flags?: Prisma.Value[];
  notes?: Prisma.Note[];
  suspendedLicenses?: SuspendedCitizenLicenses | null;
  licensePoints?: CitizenLicensePoints | null;
};

export type Pet = Prisma.Pet & {
  citizen: BaseCitizen;
  notes?: Note[];
  medicalRecords?: PetMedicalRecord[];
};

export type PetMedicalRecord = Prisma.PetMedicalRecord;

export type SuspendedCitizenLicenses = Prisma.SuspendedCitizenLicenses;
export type CitizenLicensePoints = Prisma.CitizenLicensePoints;

export type Note = Prisma.Note & {
  createdBy?: Officer | null;
};

export type RegisteredVehicle = Prisma.RegisteredVehicle & {
  citizen?: Prisma.Citizen | null;
  model: VehicleValue;
  registrationStatus: Prisma.Value;
  insuranceStatus?: Prisma.Value | null;
  flags?: Prisma.Value[];
  notes?: Prisma.Note[];
  TruckLogs?: TruckLog[];
  Business?: Business[];
  trimLevels?: Value[];
};

export type Weapon = Prisma.Weapon & {
  model: Prisma.WeaponValue & { value: Value };
  citizen: Prisma.Citizen;
  registrationStatus: Value;
};

export type MedicalRecord = Prisma.MedicalRecord & {
  bloodGroup: Value | null;
};

export type DoctorVisit = Prisma.DoctorVisit & {
  citizen: BaseCitizen;
  user?: User | null;
};

export type Value = Prisma.Value & {
  officerRankDepartments?: DepartmentValue[];
  _count?: ValueCounts;
};

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ValueCounts {
  [key: string]: number;
}

export type PenalCode = Prisma.PenalCode & {
  warningApplicable?: WarningApplicable | null;
  warningNotApplicable?: WarningNotApplicable | null;
};

export type PenalCodeGroup = Prisma.PenalCodeGroup;

export type WarningApplicable = Prisma.WarningApplicable;

export type WarningNotApplicable = Prisma.WarningNotApplicable;

export type Violation = Prisma.Violation & {
  penalCode: PenalCode | null;
};

export type SeizedItem = Prisma.SeizedItem;

export type AddressValue = Prisma.AddressValue & { value: Value };

export type EmergencyVehicleValue = Prisma.EmergencyVehicleValue & {
  divisions?: DivisionValue[];
  departments?: DepartmentValue[];
  value: Value;
};

export type DivisionValue = Prisma.DivisionValue & { value: Value };

export type CallTypeValue = Prisma.CallTypeValue & { value: Value };

export type DepartmentValueLink = Prisma.DepartmentValueLink;

export type DepartmentValue = Prisma.DepartmentValue & {
  value: Value;
  links?: DepartmentValueLink[];
};

export type DriversLicenseCategoryValue = Prisma.DriversLicenseCategoryValue & {
  value: Value;
};

export type VehicleValue = Prisma.VehicleValue & { trimLevels?: Value[]; value: Value };

export type WeaponValue = Prisma.WeaponValue & { value: Value; flags?: Value[] };

export type BleeterPost = Prisma.BleeterPost;
export type BleeterProfile = Prisma.BleeterProfile & {};
export type BleeterProfileFollow = Prisma.BleeterProfileFollow & {};

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
  value: Value;
  as: Enums.EmployeeAsEnum;
};

export type Officer = Prisma.Officer & {
  department: DepartmentValue | null;
  divisions: DivisionValue[];
  activeDivisionCallsign: Prisma.IndividualDivisionCallsign | null;
  status: StatusValue | null;
  citizen: Pick<Prisma.Citizen, "name" | "surname" | "id">;
  whitelistStatus?: (Prisma.LeoWhitelistStatus & { department: Officer["department"] }) | null;
  user?: LimitedUser | null;
  rank: Prisma.Value | null;
  activeIncident?: Prisma.LeoIncident | null;
  callsigns?: IndividualDivisionCallsign[];
  activeVehicle: EmergencyVehicleValue | null;
};

export type IndividualDivisionCallsign = Prisma.IndividualDivisionCallsign;

export type UnitQualification = Prisma.UnitQualification & {
  qualification: QualificationValue;
};

export type QualificationValue = Prisma.QualificationValue & {
  value: Value;
  departments?: DepartmentValue[];
};

export type LeoWhitelistStatus = Prisma.LeoWhitelistStatus & {
  status: Enums.WhitelistStatus;
  department: DepartmentValue;
};

export type StatusValue = Prisma.StatusValue & {
  value: Value;
  departments?: DepartmentValue[];
};

export type OfficerLog = Prisma.OfficerLog;

export type ImpoundedVehicle = Prisma.ImpoundedVehicle & {
  officer?: Officer | null;
  vehicle: Prisma.RegisteredVehicle & { citizen?: BaseCitizen | null; model: VehicleValue };
  location: Prisma.Value;
};

export type LeoIncident = Prisma.LeoIncident & {
  creator?: Officer | null;
  situationCode: StatusValue | null;
  events?: IncidentEvent[];
  unitsInvolved: IncidentInvolvedUnit[];
};

export type EmsFdIncident = Prisma.EmsFdIncident & {
  creator?: EmsFdDeputy | null;
  situationCode: StatusValue | null;
  events?: IncidentEvent[];
  unitsInvolved: IncidentInvolvedUnit[];
};

export type IncidentEvent = Prisma.IncidentEvent;

export type CombinedLeoUnit = Prisma.CombinedLeoUnit & {
  status: Officer["status"];
  department: Officer["department"];
  officers: Omit<Officer, "activeIncident">[];
  activeVehicle?: Officer["activeVehicle"];
};

export type ActiveDispatchers = Prisma.ActiveDispatchers & {
  department?: DepartmentValue | null;
};

export type DispatchChat = Prisma.DispatchChat & {
  /** null = Dispatch */
  creator: ChatCreator | null;
  call?: Call911 | null;
  /** active incident */
  incident?: LeoIncident | null;
};

export interface ChatCreator {
  unit: Officer | CombinedLeoUnit | EmsFdDeputy | CombinedEmsFdUnit;
}

export type Call911 = Prisma.Call911 & {
  position: Position | null;
  situationCode: StatusValue | null;
  departments?: DepartmentValue[];
  divisions?: DivisionValue[];
  incidents?: LeoIncident[];
  viaDispatch: boolean | null;
  type: CallTypeValue | null;
  gtaMapPosition?: Prisma.GTAMapPosition | null;
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

type _Record = Prisma.Record & {
  officer?: Officer | null;
  citizen?: BaseCitizen | null;
  business?: Pick<Business, "name" | "id"> | null;
  violations: Violation[];
  seizedItems?: Prisma.SeizedItem[];
  courtEntry?: CourtEntry | null;
  vehicle?: (Prisma.RegisteredVehicle & { model: VehicleValue }) | null;
  release?: Partial<RecordRelease> | null;
  call911?: Pick<Call911, "caseNumber"> | null;
};
export type { _Record as Record };

export type RecordRelease = Prisma.RecordRelease & {
  releasedBy: Citizen | null;
};

export type Warrant = Prisma.Warrant & {
  officer?: Officer | null;
};

export type RecordLog = Prisma.RecordLog & {
  records: _Record | null;
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
  division?: Officer["divisions"][number] | null;
  rank: Officer["rank"];
  status: Officer["status"];
  citizen: Officer["citizen"];
  user?: LimitedUser | null;
  whitelistStatus?: Officer["whitelistStatus"];
  activeVehicle: EmergencyVehicleValue | null;
};

export type CombinedEmsFdUnit = Prisma.CombinedEmsFdUnit & {
  status: EmsFdDeputy["status"];
  department: EmsFdDeputy["department"];
  deputies: Omit<EmsFdDeputy, "activeIncident">[];
  activeVehicle?: EmsFdDeputy["activeVehicle"];
};

export type TruckLog = Prisma.TruckLog & {
  citizen: Prisma.Citizen | null;
  vehicle: RegisteredVehicle | null;
};

export type LicenseExam = Prisma.LicenseExam & {
  citizen: Prisma.Citizen;
  license: Value;
  categories?: DriversLicenseCategoryValue[];
};

export type CustomField = Prisma.CustomField;

export type CustomFieldValue = Prisma.CustomFieldValue & {
  field: CustomField;
};

export type CustomRole = Prisma.CustomRole;

export type CourthousePost = Prisma.CourthousePost & {
  user: User;
};

export type ValueWithValueObj = (
  | AddressValue
  | VehicleValue
  | WeaponValue
  | StatusValue
  | DepartmentValue
  | DivisionValue
  | EmployeeValue
  | DriversLicenseCategoryValue
  | QualificationValue
  | CallTypeValue
  | EmergencyVehicleValue
) & {
  _count?: ValueCounts;
};

export type AnyValue = Value | PenalCode | ValueWithValueObj;

export type ActiveTone = Prisma.ActiveTone & {
  createdBy: { username: string };
};

export type AuditLog = Prisma.AuditLog & {
  executor?: User | null;
  action: { previous: unknown; new: unknown; type: unknown };
};
