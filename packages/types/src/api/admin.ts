import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";

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
export type PostImportVehiclesData = GetImportVehiclesData["vehicles"];

/**
 * @method DELETE
 * @route /admin/import/vehicles/:id
 */
export type DeleteImportVehiclesData = boolean;

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
 * @method DELETE
 * @route /admin/import/weapons/:id
 */
export type DeleteImportWeaponsData = boolean;

/**
 * @method GET
 * @route /admin/manage/businesses
 */
export type GetManageBusinessesData = (Prisma.Business & {
  citizen: { id: string; name: string; surname: string };
  user: Types.User;
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
    user: Types.User | null;
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
    user: Types.User | null;
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
export type GetManageCitizenByIdData = GetManageCitizensData["citizens"][number];

/**
 * @method POST
 * @route /admin/manage/citizens/record-logs/:id
 */
export type PostCitizenRecordLogsData = Prisma.Record & {
  officer?: Types.Officer | null;
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
export type PutManageCitizenByIdData = GetManageCitizensData["citizens"][number];

/**
 * @method DELETE
 * @route /admin/manage/citizens/:id
 */
export type DeleteManageCitizenByIdData = boolean;

/**
 * @method GET
 * @route /admin/manage/custom-fields
 */
export type GetManageCustomFieldsData = Prisma.CustomField[];

/**
 * @method POST
 * @route /admin/manage/custom-fields
 */
export type POstManageCustomFieldsData = Prisma.CustomField;

/**
 * @method PUT
 * @route /admin/manage/custom-fields/:id
 */
export type PutManageCustomFieldsData = Prisma.CustomField;

/**
 * @method DELETE
 * @route /admin/manage/custom-fields/:id
 */
export type DeleteManageCustomFieldsData = boolean;

/**
 * @method Get
 * @route /admin/manage/units
 */
export type GetManageUnitsData = (
  | (Types.Officer & { type: "OFFICER" })
  | (Types.EmsFdDeputy & { type: "DEPUTY" })
)[];

/**
 * @method Get
 * @route /admin/manage/units/:id
 */
export type GetManageUnitByIdData = (Types.Officer | Types.EmsFdDeputy) & {
  qualifications: Types.UnitQualification[];
  logs: Prisma.OfficerLog[];
};

/**
 * @method Put
 * @route /admin/manage/units/off-duty
 */
export type PutManageUnitsOffDutyData = (Prisma.Officer | Prisma.EmsFdDeputy)[];

/**
 * @method Put
 * @route /admin/manage/units/callsign/:unitId
 */
export type PutManageUnitCallsignData = Types.Officer | Types.EmsFdDeputy;

/**
 * @method Put
 * @route /admin/manage/units/:unitId
 */
export type PutManageUnitData = Types.Officer | Types.EmsFdDeputy;

/**
 * @method Post
 * @route /admin/manage/units/departments/:unitId
 */
export type PostManageUnitAcceptDeclineDepartmentData =
  | ((Types.Officer | Types.EmsFdDeputy) & {
      deleted?: boolean;
    })
  | null;

/**
 * @method Post
 * @route /admin/manage/units/:unitId/qualifications
 */
export type PostManageUnitAddQualificationData = Types.UnitQualification;
/**
 * @method Delete
 * @route /admin/manage/units/:unitId/qualifications/:qualificationId
 */
export type DeleteManageUnitQualificationData = boolean;

/**
 * @method Put
 * @route /admin/manage/units/:unitId/qualifications/:qualificationId
 */
export type PutManageUnitQualificationData = PostManageUnitAddQualificationData;

/**
 * @method Delete
 * @route /admin/manage/units/:unitId
 */
export type DeleteManageUnitByIdData = boolean;

/**
 * @method Get
 * @route /admin/manage/users
 */
export interface GetManageUsersData {
  totalCount: number;
  pendingCount: number;
  users: Types.User[];
}

/**
 * @method Get
 * @route /admin/manage/users/:id
 */
export type GetManageUserByIdData = Types.User & {
  citizens?: Prisma.Citizen[];
  apiToken?: (Prisma.ApiToken & { logs: Prisma.ApiTokenLog[] }) | null;
};

/**
 * @method Post
 * @route /admin/manage/users/search
 */
export type PostManageUsersSearchData = Types.User[];

/**
 * @method Put
 * @route /admin/manage/users/permissions/:id
 */
export type PutManageUserPermissionsByIdData = GetManageUserByIdData;

/**
 * @method Put
 * @route /admin/manage/users/:id
 */
export type PutManageUserByIdData = GetManageUserByIdData;

/**
 * @method Post
 * @route /admin/manage/users/temp-password/:id
 */
export type PostManageUsersGiveTempPasswordData = string;

/**
 * @method Post
 * @route /admin/manage/users/:type/:id
 */
export type PostManageUserBanUnbanData = Types.User;

/**
 * @method Delete
 * @route /admin/manage/users/:id
 */
export type DeleteManageUsersData = boolean;

/**
 * @method Post
 * @route /admin/manage/users/pending/:id/:type
 */
export type PostManageUserAcceptDeclineData = boolean;

/**
 * @method Delete
 * @route /admin/manage/users/:userId/api-token
 */
export type DeleteManageUserRevokeApiTokenData = boolean;

/**
 * @method Get
 * @route /admin/manage/expungement-requests
 */
export type GetManageExpungementRequests = (Prisma.ExpungementRequest & {
  citizen: Prisma.Citizen;
  warrants: Prisma.Warrant[];
  records: (Prisma.Record & {
    violations: (Prisma.Violation & { penalCode: Prisma.PenalCode })[];
  })[];
})[];

/**
 * @method Put
 * @route /admin/manage/expungement-requests/:id
 */
export type PutManageExpungementRequests = Prisma.ExpungementRequest;

/**
 * @method Get
 * @route /admin/manage/name-change-requests
 */
export type GetManageNameChangeRequests = (Prisma.NameChangeRequest & {
  citizen: Prisma.Citizen;
})[];

/**
 * @method Put
 * @route /admin/manage/name-change-requests/:id
 */
export type PutManageNameChangeRequests = Prisma.NameChangeRequest;

/**
 * @method GET
 * @route /admin/manage/custom-roles
 */
export type GetCustomRolesData = (Prisma.CustomRole & { discordRole?: Types.DiscordRole | null })[];

/**
 * @method POST
 * @route /admin/manage/custom-roles
 */
export type PostCustomRolesData = Prisma.CustomRole & { discordRole?: Types.DiscordRole | null };

/**
 * @method PUT
 * @route /admin/manage/custom-roles/:id
 */
export type PutCustomRoleByIdData = Prisma.CustomRole & { discordRole?: Types.DiscordRole | null };

/**
 * @method DELETE
 * @route /admin/manage/custom-roles/:id
 */
export type DeleteCustomRoleByIdData = boolean;

/**
 * @method POST
 * @route /admin/manage/custom-roles/:id
 */
export interface PostCustomRoleByIdData {
  iconId: string | null;
}

/**
 * @method PUT
 * @route /admin/manage/users/roles/:id
 */
export type PutManageUserByIdRolesData = GetManageUserByIdData;

/**
 * @method GET
 * @route /admin/audit-logs
 */
export interface GetAuditLogs {
  totalCount: number;
  auditLogs: (Prisma.AuditLog & { executor: Types.User })[];
}
