export interface cad {
  id: string;
  name: string;
  owner: User;
  ownerId: string;
  areaOfPlay: string | null;
  steamApiKey: string | null;
  whitelisted: boolean;
  towWhitelisted: boolean;
  taxiWhitelisted: boolean;
  businessWhitelisted: boolean;
  logoId: string | null;
  registrationCode: string | null;
  features: CadFeature[];
  miscCadSettings: MiscCadSettings | null;
  miscCadSettingsId: string | null;
  apiToken: ApiToken | null;
  apiTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
  autoSetUserProperties: AutoSetUserProperties | null;
  autoSetUserPropertiesId: string | null;
  discordRoles: DiscordRoles | null;
  discordRolesId: string | null;
}

export interface CadFeature {
  id: string;
  feature: Feature;
  isEnabled: boolean;
  cad: cad | null;
  cadId: string | null;
  extraFields: any | null;
}

export interface MiscCadSettings {
  id: string;
  cadOGDescription: string | null;
  heightPrefix: string;
  weightPrefix: string;
  maxCitizensPerUser: number | null;
  maxOfficersPerUser: number | null;
  maxPlateLength: number;
  maxBusinessesPerCitizen: number | null;
  maxDivisionsPerOfficer: number | null;
  maxDepartmentsEachPerUser: number | null;
  maxAssignmentsToIncidents: number | null;
  maxAssignmentsToCalls: number | null;
  callsignTemplate: string;
  caseNumberTemplate: string | null;
  pairedUnitTemplate: string | null;
  pairedUnitSymbol: string | null;
  signal100Enabled: boolean;
  liveMapURL: string | null;
  liveMapURLs: LiveMapURL[];
  roleplayEnabled: boolean | null;
  authScreenBgImageId: string | null;
  authScreenHeaderImageId: string | null;
  inactivityTimeout: number | null;
  jailTimeScale: JailTimeScale | null;
  signal100RepeatAmount: number | null;
  signal100RepeatIntervalMs: number | null;
  call911InactivityTimeout: number | null;
  incidentInactivityTimeout: number | null;
  unitInactivityTimeout: number | null;
  boloInactivityTimeout: number | null;
  activeWarrantsInactivityTimeout: number | null;
  activeDispatchersInactivityTimeout: number | null;
  driversLicenseNumberLength: number | null;
  driversLicenseTemplate: string | null;
  pilotLicenseNumberLength: number | null;
  pilotLicenseTemplate: string | null;
  weaponLicenseNumberLength: number | null;
  weaponLicenseTemplate: string | null;
  waterLicenseNumberLength: number | null;
  waterLicenseTemplate: string | null;
  driversLicenseMaxPoints: number | null;
  pilotLicenseMaxPoints: number | null;
  weaponLicenseMaxPoints: number | null;
  waterLicenseMaxPoints: number | null;
  lastInactivitySyncTimestamp: Date | null;
  webhooks: DiscordWebhook[];
  rawWebhooks: RawWebhook[];
  cad: cad[];
}

export interface LiveMapURL {
  id: string;
  url: string;
  name: string;
  MiscCadSettings: MiscCadSettings | null;
  miscCadSettingsId: string | null;
}

export interface RawWebhook {
  id: string;
  type: DiscordWebhookType;
  url: string;
  MiscCadSettings: MiscCadSettings | null;
  miscCadSettingsId: string | null;
}

export interface DiscordWebhook {
  id: string;
  type: DiscordWebhookType;
  webhookId: string | null;
  channelId: string;
  extraMessage: string | null;
  MiscCadSettings: MiscCadSettings | null;
  miscCadSettingsId: string | null;
}

export interface AutoSetUserProperties {
  id: string;
  leo: boolean | null;
  dispatch: boolean | null;
  emsFd: boolean | null;
  defaultPermissions: string[];
  cad: cad[];
}

export interface ApiToken {
  id: string;
  enabled: boolean;
  token: string | null;
  routes: string[];
  uses: number | null;
  createdAt: Date;
  updatedAt: Date;
  logs: ApiTokenLog[];
  cad: cad[];
  User: User[];
}

export interface ApiTokenLog {
  id: string;
  apiToken: ApiToken;
  apiTokenId: string;
  createdAt: Date;
  updatedAt: Date;
  statusCode: string | null;
  route: string | null;
  method: string | null;
}

export interface DiscordRoles {
  id: string;
  guildId: string;
  leoRoles: DiscordRole[];
  leoSupervisorRoles: DiscordRole[];
  emsFdRoles: DiscordRole[];
  dispatchRoles: DiscordRole[];
  towRoles: DiscordRole[];
  taxiRoles: DiscordRole[];
  adminRoles: DiscordRole[];
  whitelistedRoleId: string | null;
  whitelistedRole: DiscordRole | null;
  courthouseRoles: DiscordRole[];
  adminRolePermissions: string[];
  leoRolePermissions: string[];
  leoSupervisorRolePermissions: string[];
  emsFdRolePermissions: string[];
  dispatchRolePermissions: string[];
  towRolePermissions: string[];
  taxiRolePermissions: string[];
  courthouseRolePermissions: string[];
  roles: DiscordRole[];
  cad: cad[];
}

export interface DiscordRole {
  id: string;
  name: string;
  guildId: string | null;
  discordRoles: DiscordRoles;
  discordRolesId: string;
  CustomRole: CustomRole[];
  leoRolesArr: DiscordRoles[];
  emsFdRolesArr: DiscordRoles[];
  whitelistedRoles: DiscordRoles[];
  dispatchRolesArr: DiscordRoles[];
  leoSupervisorRolesArr: DiscordRoles[];
  taxiRolesArr: DiscordRoles[];
  towRolesArr: DiscordRoles[];
  courthouseRoles: DiscordRoles[];
  adminRolesArr: DiscordRoles[];
}

export interface AuditLog {
  id: string;
  executor: User | null;
  executorId: string | null;
  action: any;
  createdAt: Date;
  translationKey: string | null;
}

export interface User {
  id: string;
  username: string;
  password: string;
  rank: Rank;
  banned: boolean;
  banReason: string | null;
  avatarUrl: string | null;
  steamId: string | null;
  whitelistStatus: WhitelistStatus;
  isDarkTheme: boolean;
  tempPassword: string | null;
  statusViewMode: StatusViewMode;
  tableActionsAlignment: TableActionsAlignment;
  createdAt: Date;
  updatedAt: Date;
  discordId: string | null;
  lastDiscordSyncTimestamp: Date | null;
  permissions: string[];
  soundSettings: UserSoundSettings | null;
  soundSettingsId: string | null;
  apiToken: ApiToken | null;
  apiTokenId: string | null;
  roles: CustomRole[];
  locale: string | null;
  sessions: UserSession[];
  toAddDefaultPermissions: ToAddDefaultPermissions[];
  lastSeen: Date;
  developerMode: boolean;
  citizens: Citizen[];
  cads: cad[];
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
  notifications: Notification[];
  executedNotifictions: Notification[];
  medicalRecords: MedicalRecord[];
  bleeterPosts: BleeterPost[];
  businesses: Business[];
  businessPosts: BusinessPost[];
  Employee: Employee[];
  officers: Officer[];
  emsFdDeputies: EmsFdDeputy[];
  TruckLog: TruckLog[];
  ExpungementRequest: ExpungementRequest[];
  ActiveDispatchers: ActiveDispatchers[];
  User2FA: User2FA[];
  NameChangeRequest: NameChangeRequest[];
  CourthousePost: CourthousePost[];
  ActiveTone: ActiveTone[];
  AuditLog: AuditLog[];
  DoctorVisit: DoctorVisit[];
  BleeterProfile: BleeterProfile | null;
  BleeterProfileFollow: BleeterProfileFollow[];
}

export interface UserSession {
  id: string;
  refreshToken: string;
  userId: string;
  user: User;
  expires: Date;
}

export interface ToAddDefaultPermissions {
  id: string;
  key: ToAddDefaultPermissionsKey;
  user: User;
  userId: string;
  permissions: string[];
  addedAt: Date;
}

export interface UserSoundSettings {
  id: string;
  speech: boolean;
  speechVoice: string | null;
  panicButton: boolean;
  signal100: boolean;
  addedToCall: boolean;
  stopRoleplay: boolean;
  statusUpdate: boolean;
  incomingCall: boolean;
  User: User[];
}

export interface User2FA {
  id: string;
  secret: string;
  user: User;
  userId: string;
}

export interface Citizen {
  id: string;
  socialSecurityNumber: string | null;
  user: User | null;
  userId: string | null;
  name: string;
  surname: string;
  dateOfBirth: Date;
  gender: Value | null;
  genderId: string | null;
  ethnicity: Value | null;
  ethnicityId: string | null;
  hairColor: string;
  eyeColor: string;
  address: string;
  postal: string | null;
  height: string;
  weight: string;
  driversLicense: Value | null;
  driversLicenseId: string | null;
  driversLicenseNumber: string | null;
  dlCategory: DriversLicenseCategoryValue[];
  weaponLicense: Value | null;
  weaponLicenseId: string | null;
  weaponLicenseNumber: string | null;
  pilotLicense: Value | null;
  pilotLicenseId: string | null;
  pilotLicenseNumber: string | null;
  waterLicense: Value | null;
  waterLicenseId: string | null;
  waterLicenseNumber: string | null;
  ccw: Value | null;
  ccwId: string | null;
  imageId: string | null;
  imageBlurData: string | null;
  note: string | null;
  dead: boolean | null;
  dateOfDead: Date | null;
  missing: boolean | null;
  dateOfMissing: Date | null;
  arrested: boolean | null;
  phoneNumber: string | null;
  occupation: string | null;
  additionalInfo: string | null;
  flags: Value[];
  addressFlags: Value[];
  customFields: CustomFieldValue[];
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
  medicalRecords: MedicalRecord[];
  towCalls: TowCall[];
  createdTowCalls: TowCall[];
  Employee: Employee[];
  officers: Officer[];
  warrants: Warrant[];
  Record: Record[];
  emsFdDeputies: EmsFdDeputy[];
  TaxiCall: TaxiCall[];
  createdTaxiCalls: TaxiCall[];
  truckLogs: TruckLog[];
  createdAt: Date;
  updatedAt: Date;
  appearance: string | null;
  RecordRelease: RecordRelease[];
  RecordLog: RecordLog[];
  ExpungementRequest: ExpungementRequest[];
  NameChangeRequest: NameChangeRequest[];
  DLExam: DLExam[];
  notes: Note[];
  WeaponExam: WeaponExam[];
  suspendedLicenses: SuspendedCitizenLicenses | null;
  licensePoints: CitizenLicensePoints | null;
  licensePointsId: string | null;
  suspendedLicensesId: string | null;
  LicenseExam: LicenseExam[];
  DoctorVisit: DoctorVisit[];
  pets: Pet[];
}

export interface CitizenLicensePoints {
  id: string;
  driverLicensePoints: number;
  pilotLicensePoints: number;
  waterLicensePoints: number;
  firearmsLicensePoints: number;
  updatedAt: Date;
  citizens: Citizen[];
}

export interface SuspendedCitizenLicenses {
  id: string;
  driverLicense: boolean;
  driverLicenseTimeEnd: Date | null;
  pilotLicense: boolean;
  pilotLicenseTimeEnd: Date | null;
  waterLicense: boolean;
  waterLicenseTimeEnd: Date | null;
  firearmsLicense: boolean;
  firearmsLicenseTimeEnd: Date | null;
  citizens: Citizen[];
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  color: string;
  weight: string;
  dateOfBirth: Date;
  citizen: Citizen;
  citizenId: string;
  imageId: string | null;
  notes: Note[];
  medicalRecords: PetMedicalRecord[];
}

export interface Note {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Officer | null;
  createdById: string | null;
  Citizen: Citizen | null;
  citizenId: string | null;
  vehicle: RegisteredVehicle | null;
  vehicleId: string | null;
  pet: Pet | null;
  petId: string | null;
}

export interface RegisteredVehicle {
  id: string;
  user: User | null;
  userId: string | null;
  citizen: Citizen | null;
  citizenId: string | null;
  vinNumber: string;
  plate: string;
  model: VehicleValue;
  modelId: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  registrationStatus: Value;
  registrationStatusId: string;
  flags: Value[];
  insuranceStatus: Value | null;
  insuranceStatusId: string | null;
  inspectionStatus: VehicleInspectionStatus | null;
  taxStatus: VehicleTaxStatus | null;
  reportedStolen: boolean;
  impounded: boolean;
  customFields: CustomFieldValue[];
  dmvStatus: WhitelistStatus | null;
  notes: Note[];
  appearance: string | null;
  imageId: string | null;
  trimLevels: Value[];
  TruckLog: TruckLog[];
  ImpoundedVehicle: ImpoundedVehicle[];
  Business: Business[];
  Record: Record[];
}

export interface Weapon {
  id: string;
  user: User | null;
  userId: string | null;
  citizen: Citizen;
  citizenId: string;
  createdAt: Date;
  updatedAt: Date;
  serialNumber: string;
  registrationStatus: Value;
  registrationStatusId: string;
  flags: Value[];
  bofStatus: WhitelistStatus | null;
  model: WeaponValue;
  modelId: string;
  customFields: CustomFieldValue[];
}

export interface MedicalRecord {
  id: string;
  user: User | null;
  userId: string | null;
  citizen: Citizen;
  citizenId: string;
  createdAt: Date;
  updatedAt: Date;
  type: string | null;
  description: string | null;
  descriptionData: any | null;
  bloodGroup: Value | null;
  bloodGroupId: string | null;
}

export interface PetMedicalRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  pet: Pet;
  petId: string;
  type: string | null;
  description: string | null;
}

export interface DoctorVisit {
  id: string;
  user: User | null;
  userId: string | null;
  citizen: Citizen;
  citizenId: string;
  createdAt: Date;
  updatedAt: Date;
  diagnosis: string | null;
  description: string | null;
  conditions: string | null;
  medications: string | null;
}

export interface Value {
  id: string;
  type: ValueType;
  value: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  position: number | null;
  isDisabled: boolean;
  licenseType: ValueLicenseType | null;
  officerRankImageId: string | null;
  officerRankImageBlurData: string | null;
  officerRankDepartments: DepartmentValue[];
  ethnicityToValue: Citizen[];
  genderToValue: Citizen[];
  driversLicenseToValue: Citizen[];
  weaponLicenseToValue: Citizen[];
  pilotLicenseToValue: Citizen[];
  ccwToValue: Citizen[];
  registrationStatusToValue: RegisteredVehicle[];
  weaponRegistrationStatusToValue: Weapon[];
  EmployeeValue: EmployeeValue[];
  officerRankToValue: Officer[];
  StatusValueToValue: StatusValue[];
  divisionToValue: DivisionValue[];
  emsFdRankToValue: EmsFdDeputy[];
  departmentToValue: DepartmentValue[];
  driversLicenseCategoryToValue: DriversLicenseCategoryValue[];
  VehicleValue: VehicleValue[];
  WeaponValue: WeaponValue[];
  ImpoundedVehicle: ImpoundedVehicle[];
  TowCall: TowCall[];
  MedicalRecord: MedicalRecord[];
  vehicleFlags: RegisteredVehicle[];
  insuranceStatusToValue: RegisteredVehicle[];
  waterLicenseToValue: Citizen[];
  citizenFlags: Citizen[];
  DLExam: DLExam[];
  DepartmentValue: DepartmentValue[];
  QualificationValue: QualificationValue[];
  CallTypeValue: CallTypeValue[];
  WeaponExam: WeaponExam[];
  LicenseExam: LicenseExam[];
  AddressValue: AddressValue[];
  EmergencyVehicleValue: EmergencyVehicleValue[];
  CitizenAddressFlags: Citizen[];
  VehicleTrimLevels: VehicleValue[];
  RegisteredVehicle: RegisteredVehicle[];
  Weapon: Weapon[];
}

export interface AddressValue {
  id: string;
  value: Value;
  valueId: string;
  county: string | null;
  postal: string | null;
}

export interface PenalCode {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  descriptionData: any | null;
  isPrimary: boolean;
  type: PenalCodeType | null;
  warningApplicable: WarningApplicable | null;
  warningApplicableId: string | null;
  warningNotApplicable: WarningNotApplicable | null;
  warningNotApplicableId: string | null;
  violations: Violation[];
  position: number | null;
  group: PenalCodeGroup | null;
  groupId: string | null;
}

export interface PenalCodeGroup {
  id: string;
  position: number | null;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  PenalCode: PenalCode[];
}

export interface WarningApplicable {
  id: string;
  fines: number[];
  PenalCode: PenalCode[];
}

export interface WarningNotApplicable {
  id: string;
  fines: number[];
  prisonTerm: number[];
  bail: number[];
  PenalCode: PenalCode[];
}

export interface Violation {
  id: string;
  fine: number | null;
  jailTime: number | null;
  bail: number | null;
  communityService: string | null;
  penalCode: PenalCode;
  penalCodeId: string;
  records: Record[];
  counts: number | null;
}

export interface SeizedItem {
  id: string;
  record: Record;
  recordId: string;
  item: string;
  quantity: number;
  illegal: boolean;
}

export interface DivisionValue {
  id: string;
  value: Value;
  valueId: string;
  department: DepartmentValue | null;
  departmentId: string | null;
  callsign: string | null;
  officerDivisionsToDivision: Officer[];
  deputies: EmsFdDeputy[];
  pairedUnitTemplate: string | null;
  extraFields: any | null;
  Call911: Call911[];
  IndividualDivisionCallsign: IndividualDivisionCallsign[];
  EmergencyVehicleValue: EmergencyVehicleValue[];
}

export interface DepartmentValue {
  id: string;
  value: Value;
  valueId: string;
  callsign: string | null;
  customTemplate: string | null;
  whitelisted: boolean;
  isDefaultDepartment: boolean;
  type: DepartmentType;
  EmsFdDeputy: EmsFdDeputy[];
  Officer: Officer[];
  division: DivisionValue[];
  LeoWhitelistStatus: LeoWhitelistStatus[];
  Call911: Call911[];
  StatusValue: StatusValue | null;
  statusValueId: string | null;
  defaultOfficerRank: Value | null;
  defaultOfficerRankId: string | null;
  isConfidential: boolean;
  extraFields: any | null;
  Qualification: QualificationValue[];
  CombinedLeoUnit: CombinedLeoUnit[];
  Value: Value[];
  EmergencyVehicleValue: EmergencyVehicleValue[];
  mCombinedEmsFdUnit: CombinedEmsFdUnit[];
  ActiveDispatchers: ActiveDispatchers[];
}

export interface EmergencyVehicleValue {
  id: string;
  value: Value;
  valueId: string;
  departments: DepartmentValue[];
  divisions: DivisionValue[];
  Officers: Officer[];
  EmsFdDeputies: EmsFdDeputy[];
  CombinedLeoUnit: CombinedLeoUnit[];
  CombinedEmsFdUnit: CombinedEmsFdUnit[];
}

export interface DriversLicenseCategoryValue {
  id: string;
  valueId: string;
  value: Value;
  type: DriversLicenseCategoryType;
  description: string | null;
  citizens: Citizen[];
  DLExam: DLExam[];
  WeaponExam: WeaponExam[];
  LicenseExam: LicenseExam | null;
  licenseExamId: string | null;
}

export interface VehicleValue {
  id: string;
  valueId: string;
  value: Value;
  hash: string | null;
  imageId: string | null;
  trimLevels: Value[];
  RegisteredVehicle: RegisteredVehicle[];
}

export interface WeaponValue {
  id: string;
  valueId: string;
  value: Value;
  hash: string | null;
  weapon: Weapon[];
}

export interface CallTypeValue {
  id: string;
  priority: string | null;
  valueId: string;
  value: Value;
  Call911: Call911[];
}

export interface Notification {
  id: string;
  user: User;
  userId: string;
  executor: User | null;
  executorId: string | null;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BleeterProfile {
  id: string;
  name: string;
  handle: string;
  isVerified: boolean | null;
  bio: string | null;
  user: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  followers: BleeterProfileFollow[];
  following: BleeterProfileFollow[];
  posts: BleeterPost[];
}

export interface BleeterProfileFollow {
  id: string;
  user: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  followerProfile: BleeterProfile | null;
  followerProfileId: string | null;
  followingProfile: BleeterProfile | null;
  followingProfileId: string | null;
}

export interface BleeterPost {
  id: string;
  creator: BleeterProfile | null;
  creatorId: string | null;
  user: User;
  userId: string;
  title: string;
  body: string | null;
  bodyData: any | null;
  imageId: string | null;
  imageBlurData: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TowCall {
  id: string;
  userId: string | null;
  assignedUnit: Citizen | null;
  assignedUnitId: string | null;
  location: string;
  postal: string | null;
  deliveryAddress: Value | null;
  deliveryAddressId: string | null;
  plate: string | null;
  model: string | null;
  name: string | null;
  description: string | null;
  descriptionData: any | null;
  creator: Citizen | null;
  creatorId: string | null;
  ended: boolean;
  callCountyService: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxiCall {
  id: string;
  userId: string | null;
  assignedUnit: Citizen | null;
  assignedUnitId: string | null;
  location: string;
  postal: string | null;
  name: string | null;
  description: string | null;
  descriptionData: any | null;
  creator: Citizen | null;
  creatorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  user: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  whitelisted: boolean;
  address: string;
  postal: string | null;
  status: WhitelistStatus | null;
  businessPosts: BusinessPost[];
  employees: Employee[];
  Record: Record[];
  vehicles: RegisteredVehicle[];
  roles: EmployeeValue[];
  RecordLog: RecordLog[];
}

export interface Employee {
  id: string;
  user: User;
  userId: string;
  citizen: Citizen;
  citizenId: string;
  business: Business;
  businessId: string;
  role: EmployeeValue | null;
  roleId: string | null;
  employeeOfTheMonth: boolean;
  canCreatePosts: boolean;
  canManageEmployees: boolean;
  canManageVehicles: boolean;
  whitelistStatus: WhitelistStatus;
  businessPosts: BusinessPost[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessPost {
  id: string;
  user: User;
  userId: string;
  employee: Employee;
  employeeId: string;
  business: Business;
  businessId: string;
  title: string;
  body: string | null;
  bodyData: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeValue {
  id: string;
  value: Value;
  valueId: string;
  as: EmployeeAsEnum;
  employees: Employee[];
  businesses: Business[];
}

export interface Officer {
  id: string;
  department: DepartmentValue | null;
  departmentId: string | null;
  callsign: string;
  callsign2: string;
  activeDivisionCallsign: IndividualDivisionCallsign | null;
  activeDivisionCallsignId: string | null;
  incremental: number | null;
  userDefinedCallsign: string | null;
  divisions: DivisionValue[];
  rank: Value | null;
  rankId: string | null;
  position: string | null;
  status: StatusValue | null;
  statusId: string | null;
  suspended: boolean;
  badgeNumber: number | null;
  badgeNumberString: string | null;
  imageId: string | null;
  imageBlurData: string | null;
  citizen: Citizen;
  citizenId: string;
  user: User | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  whitelistStatus: LeoWhitelistStatus | null;
  whitelistStatusId: string | null;
  radioChannelId: string | null;
  bolos: Bolo[];
  warrants: Warrant[];
  logs: OfficerLog[];
  Record: Record[];
  assignedUnit: AssignedUnit[];
  activeIncident: LeoIncident | null;
  activeIncidentId: string | null;
  activeCall: Call911 | null;
  activeCallId: string | null;
  LeoIncident: LeoIncident[];
  LeoIncidentInvolvedOfficers: LeoIncident[];
  combinedLeoUnit: CombinedLeoUnit | null;
  combinedLeoUnitId: string | null;
  lastStatusChangeTimestamp: Date | null;
  qualifications: UnitQualification[];
  IncidentInvolvedUnit: IncidentInvolvedUnit[];
  Note: Note[];
  callsigns: IndividualDivisionCallsign[];
  AssignedWarrantOfficer: AssignedWarrantOfficer[];
  ImpoundedVehicle: ImpoundedVehicle[];
  activeVehicle: EmergencyVehicleValue | null;
  activeVehicleId: string | null;
  isTemporary: boolean;
  identifiers: string[];
  ChatCreator: ChatCreator[];
}

export interface IndividualDivisionCallsign {
  id: string;
  divisionId: string | null;
  division: DivisionValue | null;
  callsign: string;
  callsign2: string;
  officerId: string;
  officer: Officer;
  Officer: Officer[];
}

export interface UnitQualification {
  id: string;
  qualification: QualificationValue;
  qualificationId: string;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  officerId: string | null;
  Officer: Officer | null;
  emsFdDeputyId: string | null;
  emsFdDeputy: EmsFdDeputy | null;
}

export interface QualificationValue {
  id: string;
  imageId: string | null;
  imageBlurData: string | null;
  valueId: string;
  value: Value;
  departments: DepartmentValue[];
  departmentId: string | null;
  description: string | null;
  qualificationType: QualificationValueType;
  UnitQualification: UnitQualification[];
}

export interface LeoWhitelistStatus {
  id: string;
  status: WhitelistStatus;
  department: DepartmentValue;
  departmentId: string;
  Officers: Officer[];
  EmsFdDeputy: EmsFdDeputy[];
}

export interface StatusValue {
  id: string;
  value: Value;
  valueId: string;
  shouldDo: ShouldDoType;
  whatPages: WhatPages[];
  color: string | null;
  type: StatusValueType;
  departments: DepartmentValue[];
  officerStatusToValue: Officer[];
  emsFdStatusToValue: EmsFdDeputy[];
  CombinedLeoUnit: CombinedLeoUnit[];
  CombinedEmsFdUnit: CombinedEmsFdUnit[];
  Call911: Call911[];
  LeoIncident: LeoIncident[];
  EmsFdIncident: EmsFdIncident[];
}

export interface OfficerLog {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  userId: string | null;
  officer: Officer | null;
  officerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  emsFdDeputy: EmsFdDeputy | null;
  emsFdDeputyId: string | null;
}

export interface ImpoundedVehicle {
  id: string;
  vehicle: RegisteredVehicle;
  registeredVehicleId: string;
  location: Value;
  valueId: string;
  officer: Officer | null;
  officerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeoIncident {
  id: string;
  caseNumber: number;
  description: string | null;
  descriptionData: any | null;
  postal: string | null;
  creator: Officer | null;
  creatorId: string | null;
  officersInvolved: Officer[];
  unitsInvolved: IncidentInvolvedUnit[];
  firearmsInvolved: boolean;
  injuriesOrFatalities: boolean;
  arrestsMade: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  situationCode: StatusValue | null;
  situationCodeId: string | null;
  events: IncidentEvent[];
  calls: Call911[];
  Officer: Officer[];
  CombinedLeoUnit: CombinedLeoUnit[];
  EmsFdDeputy: EmsFdDeputy[];
  CombinedEmsFdUnit: CombinedEmsFdUnit[];
  Record: Record[];
  DispatchChat: DispatchChat[];
}

export interface IncidentEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  incident: LeoIncident;
  incidentId: string;
  description: string;
  EmsFdIncident: EmsFdIncident | null;
  emsFdIncidentId: string | null;
}

export interface CombinedLeoUnit {
  id: string;
  officers: Officer[];
  userDefinedCallsign: string | null;
  callsign: string;
  callsign2: string | null;
  department: DepartmentValue | null;
  departmentId: string | null;
  incremental: number | null;
  radioChannelId: string | null;
  status: StatusValue | null;
  statusId: string | null;
  pairedUnitTemplate: string | null;
  activeCall: Call911 | null;
  activeCallId: string | null;
  activeIncident: LeoIncident | null;
  activeIncidentId: string | null;
  lastStatusChangeTimestamp: Date | null;
  activeVehicle: EmergencyVehicleValue | null;
  activeVehicleId: string | null;
  AssignedUnit: AssignedUnit[];
  IncidentInvolvedUnit: IncidentInvolvedUnit[];
  AssignedWarrantOfficer: AssignedWarrantOfficer[];
  EmsFdIncident: EmsFdIncident | null;
  emsFdIncidentId: string | null;
  ChatCreator: ChatCreator[];
}

export interface CombinedEmsFdUnit {
  id: string;
  deputies: EmsFdDeputy[];
  callsign: string;
  userDefinedCallsign: string | null;
  callsign2: string | null;
  department: DepartmentValue | null;
  departmentId: string | null;
  incremental: number | null;
  radioChannelId: string | null;
  status: StatusValue | null;
  statusId: string | null;
  pairedUnitTemplate: string | null;
  activeCall: Call911 | null;
  activeCallId: string | null;
  activeIncident: LeoIncident | null;
  activeIncidentId: string | null;
  lastStatusChangeTimestamp: Date | null;
  activeVehicle: EmergencyVehicleValue | null;
  activeVehicleId: string | null;
  EmsFdIncident: EmsFdIncident | null;
  emsFdIncidentId: string | null;
  AssignedUnit: AssignedUnit[];
  IncidentInvolvedUnit: IncidentInvolvedUnit[];
  ChatCreator: ChatCreator[];
}

export interface ActiveDispatchers {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  userId: string;
  department: DepartmentValue | null;
  departmentId: string | null;
}

export interface DispatchChat {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  message: string;
  unitId: string;
  creator: ChatCreator | null;
  creatorId: string | null;
  call: Call911 | null;
  callId: string | null;
  incident: LeoIncident | null;
  incidentId: string | null;
}

export interface ChatCreator {
  id: string;
  officer: Officer | null;
  officerId: string | null;
  deputy: EmsFdDeputy | null;
  emsFdDeputyId: string | null;
  combinedUnit: CombinedLeoUnit | null;
  combinedLeoId: string | null;
  combinedEmsFdUnit: CombinedEmsFdUnit | null;
  combinedEmsFdId: string | null;
  createdAt: Date;
  updatedAt: Date;
  DispatchChat: DispatchChat[];
}

export interface Call911 {
  id: string;
  caseNumber: number;
  createdAt: Date;
  updatedAt: Date;
  position: Position | null;
  positionId: string | null;
  userId: string | null;
  assignedUnits: AssignedUnit[];
  location: string;
  postal: string | null;
  description: string | null;
  descriptionData: any | null;
  name: string;
  ended: boolean | null;
  situationCode: StatusValue | null;
  situationCodeId: string | null;
  viaDispatch: boolean | null;
  divisions: DivisionValue[];
  departments: DepartmentValue[];
  events: Call911Event[];
  incidents: LeoIncident[];
  type: CallTypeValue | null;
  typeId: string | null;
  Officer: Officer[];
  EmsFdDeputy: EmsFdDeputy[];
  CombinedLeoUnit: CombinedLeoUnit[];
  gtaMapPosition: GTAMapPosition | null;
  gtaMapPositionId: string | null;
  isSignal100: boolean | null;
  extraFields: any | null;
  status: WhitelistStatus | null;
  CombinedEmsFdUnit: CombinedEmsFdUnit[];
  Record: Record[];
  EmsFdIncident: EmsFdIncident | null;
  emsFdIncidentId: string | null;
  DispatchChat: DispatchChat[];
}

export interface GTAMapPosition {
  id: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  Call911: Call911[];
}

export interface Position {
  id: string;
  lat: number | null;
  lng: number | null;
  Call911: Call911[];
}

export interface AssignedUnit {
  id: string;
  isPrimary: boolean | null;
  officer: Officer | null;
  officerId: string | null;
  deputy: EmsFdDeputy | null;
  emsFdDeputyId: string | null;
  combinedUnit: CombinedLeoUnit | null;
  combinedLeoId: string | null;
  combinedEmsFdUnit: CombinedEmsFdUnit | null;
  combinedEmsFdId: string | null;
  call911: Call911 | null;
  call911Id: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignedWarrantOfficer {
  id: string;
  officer: Officer | null;
  officerId: string | null;
  combinedUnit: CombinedLeoUnit | null;
  combinedLeoId: string | null;
  warrant: Warrant | null;
  warrantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentInvolvedUnit {
  id: string;
  officer: Officer | null;
  officerId: string | null;
  deputy: EmsFdDeputy | null;
  emsFdDeputyId: string | null;
  combinedUnit: CombinedLeoUnit | null;
  combinedLeoId: string | null;
  combinedEmsFdUnit: CombinedEmsFdUnit | null;
  combinedEmsFdId: string | null;
  incident: LeoIncident | null;
  incidentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  emsFdIncident: EmsFdIncident | null;
  emsFdIncidentId: string | null;
}

export interface Call911Event {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  call: Call911;
  call911Id: string;
  description: string;
  translationData: any | null;
}

export interface Bolo {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: BoloType;
  description: string | null;
  plate: string | null;
  model: string | null;
  color: string | null;
  name: string | null;
  officer: Officer | null;
  officerId: string | null;
}

export interface Record {
  id: string;
  caseNumber: number;
  type: RecordType;
  citizen: Citizen | null;
  citizenId: string | null;
  officer: Officer | null;
  officerId: string | null;
  violations: Violation[];
  createdAt: Date;
  updatedAt: Date;
  postal: string;
  address: string | null;
  notes: string | null;
  descriptionData: any | null;
  release: RecordRelease | null;
  releaseId: string | null;
  courtEntry: CourtEntry | null;
  CourtEntryId: string | null;
  RecordLog: RecordLog[];
  ExpungementRequest: ExpungementRequest | null;
  expungementRequestId: string | null;
  seizedItems: SeizedItem[];
  status: WhitelistStatus | null;
  paymentStatus: PaymentStatus | null;
  vehicle: RegisteredVehicle | null;
  vehicleId: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  call911: Call911 | null;
  call911Id: string | null;
  incident: LeoIncident | null;
  incidentId: string | null;
  business: Business | null;
  businessId: string | null;
  EmsFdIncident: EmsFdIncident | null;
  emsFdIncidentId: string | null;
}

export interface RecordRelease {
  id: string;
  type: ReleaseType;
  releasedBy: Citizen | null;
  citizenId: string | null;
  Record: Record[];
}

export interface Warrant {
  id: string;
  citizen: Citizen;
  citizenId: string;
  officer: Officer | null;
  officerId: string | null;
  assignedOfficers: AssignedWarrantOfficer[];
  description: string;
  status: WarrantStatus;
  createdAt: Date;
  updatedAt: Date;
  RecordLog: RecordLog[];
  ExpungementRequest: ExpungementRequest | null;
  expungementRequestId: string | null;
  approvalStatus: WhitelistStatus | null;
}

export interface RecordLog {
  id: string;
  citizen: Citizen | null;
  citizenId: string | null;
  business: Business | null;
  businessId: string | null;
  records: Record | null;
  recordId: string | null;
  warrant: Warrant | null;
  warrantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpungementRequest {
  id: string;
  citizen: Citizen;
  citizenId: string;
  user: User | null;
  userId: string | null;
  status: ExpungementRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  warrants: Warrant[];
  records: Record[];
}

export interface NameChangeRequest {
  id: string;
  citizen: Citizen;
  citizenId: string;
  user: User | null;
  userId: string | null;
  newName: string;
  newSurname: string;
  description: string | null;
  status: WhitelistStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourtEntry {
  id: string;
  title: string;
  caseNumber: string;
  descriptionData: any | null;
  dates: CourtDate[];
  createdAt: Date;
  updatedAt: Date;
  records: Record[];
}

export interface CourtDate {
  id: string;
  note: string | null;
  date: Date;
  courtEntry: CourtEntry;
  courtEntryId: string;
}

export interface EmsFdDeputy {
  id: string;
  department: DepartmentValue | null;
  departmentId: string | null;
  callsign: string;
  callsign2: string;
  incremental: number | null;
  userDefinedCallsign: string | null;
  division: DivisionValue | null;
  divisionId: string | null;
  position: string | null;
  rank: Value | null;
  rankId: string | null;
  status: StatusValue | null;
  statusId: string | null;
  suspended: boolean;
  badgeNumber: number | null;
  badgeNumberString: string | null;
  imageId: string | null;
  imageBlurData: string | null;
  citizen: Citizen;
  citizenId: string;
  user: User | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  radioChannelId: string | null;
  activeCall: Call911 | null;
  activeCallId: string | null;
  activeIncident: LeoIncident | null;
  activeIncidentId: string | null;
  whitelistStatus: LeoWhitelistStatus | null;
  whitelistStatusId: string | null;
  logs: OfficerLog[];
  AssignedUnit: AssignedUnit[];
  lastStatusChangeTimestamp: Date | null;
  qualifications: UnitQualification[];
  IncidentInvolvedUnit: IncidentInvolvedUnit[];
  activeVehicle: EmergencyVehicleValue | null;
  activeVehicleId: string | null;
  isTemporary: boolean;
  identifiers: string[];
  CombinedEmsFdUnit: CombinedEmsFdUnit | null;
  combinedEmsFdUnitId: string | null;
  EmsFdIncident: EmsFdIncident[];
  ChatCreator: ChatCreator[];
}

export interface EmsFdIncident {
  id: string;
  caseNumber: number;
  description: string | null;
  descriptionData: any | null;
  postal: string | null;
  creator: EmsFdDeputy | null;
  creatorId: string | null;
  unitsInvolved: IncidentInvolvedUnit[];
  firearmsInvolved: boolean;
  injuriesOrFatalities: boolean;
  arrestsMade: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  situationCode: StatusValue | null;
  situationCodeId: string | null;
  events: IncidentEvent[];
  calls: Call911[];
  CombinedLeoUnit: CombinedLeoUnit[];
  CombinedEmsFdUnit: CombinedEmsFdUnit[];
  Record: Record[];
}

export interface TruckLog {
  id: string;
  citizen: Citizen | null;
  citizenId: string | null;
  user: User;
  userId: string;
  vehicle: RegisteredVehicle | null;
  vehicleId: string | null;
  startedAt: string;
  endedAt: string;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
}

export interface LicenseExam {
  id: string;
  theoryExam: DLExamPassType | null;
  practiceExam: DLExamPassType | null;
  status: DLExamStatus;
  createdAt: Date;
  updatedAt: Date;
  type: LicenseExamType;
  citizen: Citizen;
  citizenId: string;
  license: Value;
  licenseId: string;
  categories: DriversLicenseCategoryValue[];
}

export interface DLExam {
  id: string;
  citizen: Citizen;
  citizenId: string;
  theoryExam: DLExamPassType | null;
  practiceExam: DLExamPassType | null;
  license: Value;
  licenseId: string;
  categories: DriversLicenseCategoryValue[];
  status: DLExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeaponExam {
  id: string;
  citizen: Citizen;
  citizenId: string;
  theoryExam: DLExamPassType | null;
  practiceExam: DLExamPassType | null;
  license: Value;
  licenseId: string;
  categories: DriversLicenseCategoryValue[];
  status: DLExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  name: string;
  citizenEditable: boolean;
  category: CustomFieldCategory;
  values: CustomFieldValue[];
}

export interface CustomFieldValue {
  id: string;
  value: string | null;
  field: CustomField;
  fieldId: string;
  Citizens: Citizen[];
  RegisteredVehicles: RegisteredVehicle[];
  Weapons: Weapon[];
}

export interface CustomRole {
  id: string;
  name: string;
  iconId: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  discordRole: DiscordRole | null;
  discordRoleId: string | null;
  User: User[];
}

export interface CourthousePost {
  id: string;
  user: User;
  userId: string;
  title: string;
  descriptionData: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveTone {
  id: string;
  type: ActiveToneType;
  description: string | null;
  createdAt: Date;
  createdBy: User;
  createdById: string;
}

enum ActiveToneType {
  LEO = "LEO",
  EMS_FD = "EMS_FD",
  SHARED = "SHARED",
}

enum LicenseExamType {
  DRIVER = "DRIVER",
  FIREARM = "FIREARM",
  WATER = "WATER",
  PILOT = "PILOT",
}

enum QualificationValueType {
  QUALIFICATION = "QUALIFICATION",
  AWARD = "AWARD",
}

enum CustomFieldCategory {
  CITIZEN = "CITIZEN",
  WEAPON = "WEAPON",
  VEHICLE = "VEHICLE",
}

enum DLExamPassType {
  PASSED = "PASSED",
  FAILED = "FAILED",
}

enum DLExamStatus {
  IN_PROGRESS = "IN_PROGRESS",
  PASSED = "PASSED",
  FAILED = "FAILED",
}

enum StatusViewMode {
  FULL_ROW_COLOR = "FULL_ROW_COLOR",
  DOT_COLOR = "DOT_COLOR",
}

enum TableActionsAlignment {
  NONE = "NONE",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

enum Rank {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  USER = "USER",
}

enum WhitelistStatus {
  ACCEPTED = "ACCEPTED",
  PENDING = "PENDING",
  DECLINED = "DECLINED",
}

enum ValueLicenseType {
  LICENSE = "LICENSE",
  REGISTRATION_STATUS = "REGISTRATION_STATUS",
  INSURANCE_STATUS = "INSURANCE_STATUS",
}

enum DepartmentType {
  LEO = "LEO",
  EMS_FD = "EMS_FD",
}

enum ValueType {
  LICENSE = "LICENSE",
  GENDER = "GENDER",
  ETHNICITY = "ETHNICITY",
  VEHICLE = "VEHICLE",
  WEAPON = "WEAPON",
  BLOOD_GROUP = "BLOOD_GROUP",
  BUSINESS_ROLE = "BUSINESS_ROLE",
  CODES_10 = "CODES_10",
  PENAL_CODE = "PENAL_CODE",
  DEPARTMENT = "DEPARTMENT",
  OFFICER_RANK = "OFFICER_RANK",
  DIVISION = "DIVISION",
  DRIVERSLICENSE_CATEGORY = "DRIVERSLICENSE_CATEGORY",
  IMPOUND_LOT = "IMPOUND_LOT",
  VEHICLE_FLAG = "VEHICLE_FLAG",
  CITIZEN_FLAG = "CITIZEN_FLAG",
  QUALIFICATION = "QUALIFICATION",
  CALL_TYPE = "CALL_TYPE",
  ADDRESS = "ADDRESS",
  EMERGENCY_VEHICLE = "EMERGENCY_VEHICLE",
  ADDRESS_FLAG = "ADDRESS_FLAG",
  VEHICLE_TRIM_LEVEL = "VEHICLE_TRIM_LEVEL",
  WEAPON_FLAG = "WEAPON_FLAG",
}

enum DriversLicenseCategoryType {
  AUTOMOTIVE = "AUTOMOTIVE",
  AVIATION = "AVIATION",
  WATER = "WATER",
  FIREARM = "FIREARM",
}

enum EmployeeAsEnum {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

enum StatusValueType {
  STATUS_CODE = "STATUS_CODE",
  SITUATION_CODE = "SITUATION_CODE",
}

enum WhatPages {
  DISPATCH = "DISPATCH",
  EMS_FD = "EMS_FD",
  LEO = "LEO",
}

enum ShouldDoType {
  SET_OFF_DUTY = "SET_OFF_DUTY",
  SET_ON_DUTY = "SET_ON_DUTY",
  SET_ASSIGNED = "SET_ASSIGNED",
  SET_STATUS = "SET_STATUS",
  PANIC_BUTTON = "PANIC_BUTTON",
  EN_ROUTE = "EN_ROUTE",
  ON_SCENE = "ON_SCENE",
  UNAVAILABLE = "UNAVAILABLE",
}

enum BoloType {
  VEHICLE = "VEHICLE",
  PERSON = "PERSON",
  OTHER = "OTHER",
}

enum ReleaseType {
  TIME_OUT = "TIME_OUT",
  BAIL_POSTED = "BAIL_POSTED",
}

enum RecordType {
  ARREST_REPORT = "ARREST_REPORT",
  TICKET = "TICKET",
  WRITTEN_WARNING = "WRITTEN_WARNING",
}

enum WarrantStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

enum ExpungementRequestStatus {
  ACCEPTED = "ACCEPTED",
  DENIED = "DENIED",
  PENDING = "PENDING",
  CANCELED = "CANCELED",
}

enum VehicleInspectionStatus {
  PASSED = "PASSED",
  FAILED = "FAILED",
}

enum VehicleTaxStatus {
  TAXED = "TAXED",
  UNTAXED = "UNTAXED",
}

enum DiscordWebhookType {
  CALL_911 = "CALL_911",
  PANIC_BUTTON = "PANIC_BUTTON",
  UNIT_STATUS = "UNIT_STATUS",
  BOLO = "BOLO",
  CITIZEN_RECORD = "CITIZEN_RECORD",
  VEHICLE_IMPOUNDED = "VEHICLE_IMPOUNDED",
  WARRANTS = "WARRANTS",
  BLEETER_POST = "BLEETER_POST",
  CITIZEN_DECLARED_DEAD = "CITIZEN_DECLARED_DEAD",
}

enum JailTimeScale {
  HOURS = "HOURS",
  MINUTES = "MINUTES",
  SECONDS = "SECONDS",
}

enum PaymentStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
}

enum ToAddDefaultPermissionsKey {
  MANAGE_WARRANTS_PERMISSIONS = "MANAGE_WARRANTS_PERMISSIONS",
  MANAGE_AWARDS_AND_QUALIFICATIONS = "MANAGE_AWARDS_AND_QUALIFICATIONS",
}

enum PenalCodeType {
  INFRACTION = "INFRACTION",
  MISDEMEANOR = "MISDEMEANOR",
  FELONY = "FELONY",
}

enum Feature {
  BLEETER = "BLEETER",
  TOW = "TOW",
  TAXI = "TAXI",
  COURTHOUSE = "COURTHOUSE",
  TRUCK_LOGS = "TRUCK_LOGS",
  AOP = "AOP",
  BUSINESS = "BUSINESS",
  ALLOW_DUPLICATE_CITIZEN_NAMES = "ALLOW_DUPLICATE_CITIZEN_NAMES",
  DISCORD_AUTH = "DISCORD_AUTH",
  CALLS_911 = "CALLS_911",
  WEAPON_REGISTRATION = "WEAPON_REGISTRATION",
  SOCIAL_SECURITY_NUMBERS = "SOCIAL_SECURITY_NUMBERS",
  CUSTOM_TEXTFIELD_VALUES = "CUSTOM_TEXTFIELD_VALUES",
  DISALLOW_TEXTFIELD_SELECTION = "DISALLOW_TEXTFIELD_SELECTION",
  ACTIVE_DISPATCHERS = "ACTIVE_DISPATCHERS",
  ACTIVE_INCIDENTS = "ACTIVE_INCIDENTS",
  ALLOW_CITIZEN_UPDATE_LICENSE = "ALLOW_CITIZEN_UPDATE_LICENSE",
  ALLOW_REGULAR_LOGIN = "ALLOW_REGULAR_LOGIN",
  RADIO_CHANNEL_MANAGEMENT = "RADIO_CHANNEL_MANAGEMENT",
  ALLOW_CITIZEN_DELETION_BY_NON_ADMIN = "ALLOW_CITIZEN_DELETION_BY_NON_ADMIN",
  DL_EXAMS = "DL_EXAMS",
  DMV = "DMV",
  BADGE_NUMBERS = "BADGE_NUMBERS",
  USER_API_TOKENS = "USER_API_TOKENS",
  CITIZEN_RECORD_APPROVAL = "CITIZEN_RECORD_APPROVAL",
  COMMON_CITIZEN_CARDS = "COMMON_CITIZEN_CARDS",
  STEAM_OAUTH = "STEAM_OAUTH",
  CREATE_USER_CITIZEN_LEO = "CREATE_USER_CITIZEN_LEO",
  LEO_TICKETS = "LEO_TICKETS",
  LEO_BAIL = "LEO_BAIL",
  COURTHOUSE_POSTS = "COURTHOUSE_POSTS",
  WEAPON_EXAMS = "WEAPON_EXAMS",
  ACTIVE_WARRANTS = "ACTIVE_WARRANTS",
  CITIZEN_DELETE_ON_DEAD = "CITIZEN_DELETE_ON_DEAD",
  PANIC_BUTTON = "PANIC_BUTTON",
  WARRANT_STATUS_APPROVAL = "WARRANT_STATUS_APPROVAL",
  DIVISIONS = "DIVISIONS",
  TONES = "TONES",
  LICENSE_EXAMS = "LICENSE_EXAMS",
  CITIZEN_CREATION_RECORDS = "CITIZEN_CREATION_RECORDS",
  BUREAU_OF_FIREARMS = "BUREAU_OF_FIREARMS",
  CALL_911_APPROVAL = "CALL_911_APPROVAL",
  FORCE_DISCORD_AUTH = "FORCE_DISCORD_AUTH",
  FORCE_STEAM_AUTH = "FORCE_STEAM_AUTH",
  EDITABLE_SSN = "EDITABLE_SSN",
  EDITABLE_VIN = "EDITABLE_VIN",
  SIGNAL_100_CITIZEN = "SIGNAL_100_CITIZEN",
  FORCE_ACCOUNT_PASSWORD = "FORCE_ACCOUNT_PASSWORD",
  USER_DEFINED_CALLSIGN_COMBINED_UNIT = "USER_DEFINED_CALLSIGN_COMBINED_UNIT",
  HOSPITAL_SERVICES = "HOSPITAL_SERVICES",
  MEDICAL_RECORDS_CITIZEN_MANAGEABLE = "MEDICAL_RECORDS_CITIZEN_MANAGEABLE",
  PETS = "PETS",
  REQUIRED_CITIZEN_IMAGE = "REQUIRED_CITIZEN_IMAGE",
  LEO_EDITABLE_CITIZEN_PROFILE = "LEO_EDITABLE_CITIZEN_PROFILE",
  ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER = "ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER",
}
