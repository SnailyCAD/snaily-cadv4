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
  officerCount: number;
  onDutyOfficers: number;
  emsDeputiesCount: number;
  suspendedOfficers: number;
  suspendedEmsFDDeputies: number;
  onDutyEmsDeputies: number;
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
    citizen?: Prisma.Citizen | null;
    flags: Prisma.Value[];
    model: Prisma.VehicleValue & { value: Prisma.Value };
    registrationStatus: Prisma.Value;
    insuranceStatus: Prisma.Value | null;
    TruckLog: Prisma.TruckLog[];
    Business: Prisma.Business[];
  })[];
}

/**
 * @method GET
 * @route /admin/import/vehicles/plates
 */
export type GetImportVehiclesPlatesData = { plate: string }[];

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
export interface GetManageBusinessesData {
  totalCount: number;
  businesses: (Prisma.Business & {
    citizen: { id: string; name: string; surname: string };
    user: Types.User;
  })[];
}

/**
 * @method GET
 * @route /admin/manage/businesses/:id
 */
export interface GetManageBusinessByIdEmployeesData {
  totalCount: number;
  employees: (Prisma.Employee & {
    citizen: Pick<Types.BaseCitizen, "id" | "name" | "surname">;
    role: Types.EmployeeValue | null;
  })[];
}

/**
 * @method PUT
 * @route /admin/manage/businesses
 */
export type PutManageBusinessesData = GetManageBusinessesData["businesses"][number];

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
    gender?: Types.Value | null;
    ethnicity?: Types.Value | null;
    user: Types.User | null;
  })[];
}

/**
 * @method GET
 * @route /admin/manage/citizens/record-logs
 */
export interface GetManageRecordLogsData {
  totalCount: number;
  citizens: Prisma.Citizen[];
}

/**
 * @method GET
 * @route /admin/manage/citizens/pending-arrest-reports
 */
export interface GetManagePendingArrestReports {
  totalCount: number;
  arrestReports: GetManageRecordsLogsCitizenData["recordsLogs"];
}

/**
 * @method GET
 * @route /admin/manage/citizens/record-logs/:citizenId
 */
export interface GetManageRecordsLogsCitizenData {
  totalCount: number;
  recordsLogs: (Prisma.RecordLog & {
    business?: Prisma.Business | null;
    citizen?:
      | (Prisma.Citizen & {
          user: Types.User | null;
          ethnicity?: Prisma.Value | null;
          gender?: Prisma.Value | null;
        })
      | null;
    warrant: Types.Warrant | null;
    records: Types.Record | null;
  })[];
}

/**
 * @method GET
 * @route /admin/manage/citizens/:id
 */
export type GetManageCitizenByIdData =
  | (Prisma.Citizen & {
      flags: Prisma.Value[];
      vehicles: Omit<GetImportVehiclesData["vehicles"][number], "citizen">[];
      weapons: Omit<GetImportWeaponsData["weapons"][number], "citizen">[];
      user: Types.User | null;
      ethnicity?: Prisma.Value | null;
      gender?: Prisma.Value | null;
      weaponLicense: Prisma.Value | null;
      driversLicense: Prisma.Value | null;
      pilotLicense: Prisma.Value | null;
      waterLicense: Prisma.Value | null;
      dlCategory: (Prisma.DriversLicenseCategoryValue & { value: Prisma.Value })[];
      Record: (Prisma.Record & {})[];
    })
  | null;

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
export type PutManageCitizenByIdData = Types.BaseCitizen;

/**
 * @method DELETE
 * @route /admin/manage/citizens/:id
 */
export type DeleteManageCitizenByIdData = boolean;

/**
 * @method GET
 * @route /admin/manage/custom-fields
 */
export interface GetManageCustomFieldsData {
  customFields: Prisma.CustomField[];
  totalCount: number;
}

/**
 * @method POST
 * @route /admin/manage/custom-fields
 */
export type PostManageCustomFieldsData = Prisma.CustomField;

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
export interface GetManageUnitsData {
  totalCount: number;
  units: ((Types.Officer & { type: "OFFICER" }) | (Types.EmsFdDeputy & { type: "DEPUTY" }))[];
}
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
 * @route /admin/manage/users/prune
 */
export interface GetManageUsersInactiveUsers {
  totalCount: number;
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
export interface GetManageExpungementRequests {
  pendingExpungementRequests: (Prisma.ExpungementRequest & {
    citizen: Prisma.Citizen;
    warrants: Prisma.Warrant[];
    records: (Prisma.Record & {
      violations: (Prisma.Violation & { penalCode: Prisma.PenalCode })[];
    })[];
  })[];
  totalCount: number;
}

/**
 * @method Put
 * @route /admin/manage/expungement-requests/:id
 */
export type PutManageExpungementRequests = Prisma.ExpungementRequest;

/**
 * @method Get
 * @route /admin/manage/name-change-requests
 */
export interface GetManageNameChangeRequests {
  pendingNameChangeRequests: (Prisma.NameChangeRequest & {
    citizen: Prisma.Citizen;
  })[];
  totalCount: number;
}

/**
 * @method Put
 * @route /admin/manage/name-change-requests/:id
 */
export type PutManageNameChangeRequests = Prisma.NameChangeRequest;

/**
 * @method Get
 * @route /admin/manage/pending-warrants
 */
export interface GetManagePendingWarrants {
  pendingWarrants: (Prisma.Warrant & {
    citizen: Prisma.Citizen;
    assignedOfficers: Types.AssignedWarrantOfficer[];
    officer: Types.Officer;
  })[];
  totalCount: number;
}

/**
 * @method Put
 * @route /admin/manage/pending-warrants/:id
 */
export type PutManagePendingWarrants = boolean;

/**
 * @method GET
 * @route /admin/manage/custom-roles
 */
export interface GetCustomRolesData {
  totalCount: number;
  customRoles: (Prisma.CustomRole & { discordRole?: Types.DiscordRole | null })[];
}

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
 * @route /admin/manage/cad-settings/audit-logs
 */
export interface GetAuditLogsData {
  totalCount: number;
  logs: Types.AuditLog[];
}

/**
 * @method Get
 * @route /admin/manage/units/department-time-logs/departments
 */
export interface GetDepartmentTimeLogsDepartmentsData {
  totalCount: number;
  logs: { hours: number; department: Types.DepartmentValue; departmentId: string }[];
}

/**
 * @method Get
 * @route /admin/manage/units/department-time-logs/units
 */
export interface GetDepartmentTimeLogsUnitsData {
  totalCount: number;
  logs: {
    hours: number;
    unit: Types.Officer | Types.EmsFdDeputy;
    unitId: string;
    firstSeen: Date;
    lastSeen: Date;
  }[];
}

/**
 * @method Get
 * @route /admin/manage/units/prune
 */
export type GetManageUnitsInactiveUnits = (Types.Officer | Types.EmsFdDeputy)[];
