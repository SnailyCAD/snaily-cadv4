import type * as Prisma from "@prisma/client";

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
  | "locale";

type User = Pick<
  Prisma.User & {
    apiToken: Prisma.ApiToken | null;
    soundSettings: Prisma.UserSoundSettings | null;
  },
  UserPicks
>;

/**
 * @method GET
 * @route /admin
 */
export interface GetAdminDashboardData {
  activeUsers: number;
  pendingUsers: number;
  bannedUsers: number;
  createdCitizens: number;
  citizensInBolo: number;
  arrestCitizens: number;
  deadCitizens: number;
  vehicles: number;
  impoundedVehicles: number;
  vehiclesInBOLO: number;
  imageData: { count: number; totalSize: number };
}

/**
 * @method POST
 * @route /admin/import/citizens
 */
export type PostImportCitizensData = (Prisma.Citizen & {})[];

/**
 * @method GET
 * @route /admin/import/vehicles
 */
export interface GetImportVehiclesData {
  totalCount: number;
  vehicles: (Prisma.RegisteredVehicle & {
    citizen: Prisma.Citizen;
    flags: Prisma.Value[];
    model: Prisma.VehicleValue & { value: Prisma.Value };
    registrationStatus: Prisma.Value;
    insuranceStatus: Prisma.Value | null;
    TruckLog: Prisma.TruckLog[];
    Business: Prisma.Business[];
  })[];
}

/**
 * @method POST
 * @route /admin/import/vehicles
 */
export type PostImportVehiclesData = Prisma.RegisteredVehicle[];

/**
 * @method GET
 * @route /admin/import/weapons
 */
export interface GetImportWeaponsData {
  totalCount: number;
  weapons: (Prisma.Weapon & {
    model: Prisma.WeaponValue & { value: Prisma.Value };
    citizen: Prisma.Citizen;
    registrationStatus: Prisma.Value;
  })[];
}

/**
 * @method POST
 * @route /admin/import/weapons
 */
export type PostImportWeaponsData = GetImportWeaponsData["weapons"];

/**
 * @method GET
 * @route /admin/manage/businesses
 */
export type GetManageBusinessesData = (Prisma.Business & {
  citizen: { id: string; name: string; surname: string };
  user: User;
})[];

/**
 * @method PUT
 * @route /admin/manage/businesses
 */
export type PutManageBusinessesData = GetManageBusinessesData[number];

/**
 * @method DELETE
 * @route /admin/manage/businesses
 */
export type DeleteManageBusinessesData = boolean;

/**
 * @method GET
 * @route /admin/manage/citizens
 */
export interface GetManageCitizensData {
  totalCount: number;
  citizens: (Prisma.Citizen & {
    flags: Prisma.Value[];
    vehicles: Omit<GetImportVehiclesData["vehicles"][number], "citizen">[];
    weapons: Omit<GetImportWeaponsData["weapons"][number], "citizen">[];
    user: User | null;
    ethnicity: Prisma.Value;
    gender: Prisma.Value;
    weaponLicense: Prisma.Value | null;
    driversLicense: Prisma.Value | null;
    pilotLicense: Prisma.Value | null;
    waterLicense: Prisma.Value | null;
    dlCategory: (Prisma.DriversLicenseCategoryValue & { value: Prisma.Value })[];
    Record: (Prisma.Record & {})[];
  })[];
}

/**
 * @method GET
 * @route /admin/manage/citizens/record-logs
 */
export type GetManageRecordLogsData = (Prisma.RecordLog & {
  citizen: Prisma.Citizen & {
    user: User | null;
    ethnicity: Prisma.Value;
    gender: Prisma.Value;
  };
  warrant: (Prisma.Warrant & {}) | null;
  records: (Prisma.Record & {}) | null;
})[];

/**
 * @method GET
 * @route /admin/manage/citizens/:id
 */
export type GetManageCitizenById = GetManageCitizensData["citizens"][number];

/**
 * @method POST
 * @route /admin/manage/citizens/record-logs/:id
 */
export type PostCitizenRecordLogs = Prisma.Record & {
  officer: Prisma.Officer & {
    rank: Prisma.Value | null;
    whitelistStatus:
      | (Prisma.LeoWhitelistStatus & {
          department: Prisma.DepartmentValue & { value: Prisma.Value };
        })
      | null;
    /** todo: ... 10 ... */
    activeDivisionCallsign: Prisma.IndividualDivisionCallsign | null;
  };
  violations: (Prisma.Violation & {
    penalCode: Prisma.PenalCode & {
      warningApplicable: Prisma.WarningApplicable | null;
      warningNotApplicable: Prisma.WarningNotApplicable | null;
    };
  })[];
  seizedItems: Prisma.SeizedItem[];
};

/**
 * @method PUT
 * @route /admin/manage/citizens/:id
 */
export type PutManageCitizenById = GetManageCitizensData["citizens"][number];

/**
 * @method DELETE
 * @route /admin/manage/citizens/:id
 */
export type DeleteManageCitizenById = boolean;

/**
 * @method GET
 * @route /admin/manage/custom-fields
 */
export type GetManageCustomFields = Prisma.CustomField[];

/**
 * @method POST
 * @route /admin/manage/custom-fields
 */
export type POstManageCustomFields = Prisma.CustomField;

/**
 * @method PUT
 * @route /admin/manage/custom-fields/:id
 */
export type PutManageCustomFields = Prisma.CustomField;

/**
 * @method DELETE
 * @route /admin/manage/custom-fields/:id
 */
export type DeleteManageCustomFields = boolean;
