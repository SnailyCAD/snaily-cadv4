import type * as Prisma from "@prisma/client";
import type { EmsFdDeputy, Officer, TaxiCall, TowCall, UnitQualification, User } from "./index.js";

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
export type GetManageCitizenByIdData = GetManageCitizensData["citizens"][number];

/**
 * @method POST
 * @route /admin/manage/citizens/record-logs/:id
 */
export type PostCitizenRecordLogsData = Prisma.Record & {
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
  | (Officer & { type: "OFFICER" })
  | (EmsFdDeputy & { type: "DEPUTY" })
)[];

/**
 * @method Get
 * @route /admin/manage/units/:id
 */
export type GetManageUnitByIdData = (Officer | EmsFdDeputy) & {
  qualifications: UnitQualification[];
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
export type PutManageUnitCallsignData = Officer | EmsFdDeputy;

/**
 * @method Put
 * @route /admin/manage/units/:unitId
 */
export type PutManageUnitData = Officer | EmsFdDeputy;

/**
 * @method Post
 * @route /admin/manage/units/departments/:unitId
 */
export type PostManageUnitAcceptDeclineDepartmentData =
  | ((Officer | EmsFdDeputy) & {
      deleted?: boolean;
    })
  | null;

/**
 * @method Post
 * @route /admin/manage/units/:unitId/qualifications
 */
export type PostManageUnitAddQualificationData = UnitQualification;
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
  users: User[];
}

/**
 * @method Get
 * @route /admin/manage/users/:id
 */
export type GetManageUserByIdData = User & {
  citizens?: Prisma.Citizen[];
  apiToken?: (Prisma.ApiToken & { logs: Prisma.ApiTokenLog[] }) | null;
};

/**
 * @method Post
 * @route /admin/manage/users/search
 */
export type PostManageUsersSearchData = User[];

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
export type PostManageUserBanUnbanData = User;

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

/** bleeter */
/**
 * @method Get
 * @route /bleeter
 */
export type GetBleeterData = (Prisma.BleeterPost & { user: Pick<User, "username"> })[];

/**
 * @method Get
 * @route /bleeter/:id
 */
export type GetBleeterByIdData = GetBleeterData[number];

/**
 * @method Post
 * @route /bleeter/:id
 */
export type PostBleeterByIdData = Prisma.BleeterPost;

/**
 * @method Put
 * @route /bleeter/:id
 */
export type PutBleeterByIdData = Prisma.BleeterPost;

/**
 * @method Post
 * @route /bleeter/:id
 */
export type PostBleeterByIdImageData = Pick<Prisma.BleeterPost, "imageId">;

/**
 * @method Delete
 * @route /bleeter/:id
 */
export type DeleteBleeterByIdData = boolean;

/** taxi */
/**
 * @method Get
 * @route /taxi
 */
export type GetTaxiCallsData = TaxiCall[];

/**
 * @method Post
 * @route /taxi
 */
export type PostTaxiCallsData = GetTaxiCallsData[number];

/**
 * @method Put
 * @route /taxi/:id
 */
export type PutTaxiCallsData = GetTaxiCallsData[number];

/**
 * @method Delete
 * @route /taxi/:id
 */
export type DeleteTaxiCallsData = boolean;

/** tow */
/**
 * @method Get
 * @route /tow
 */
export type GetTowCallsData = TowCall[];

/**
 * @method Post
 * @route /tow
 */
export type PostTowCallsData = GetTowCallsData[number];

/**
 * @method Put
 * @route /tow/:id
 */
export type PutTowCallsData = GetTowCallsData[number];

/**
 * @method Delete
 * @route /tow/:id
 */
export type DeleteTowCallsData = boolean;

/** auth */
/**
 * @method Post
 * @route /auth/login
 */
export interface PostLoginUserData {
  userId?: User["id"];
  hasTempPassword?: boolean;
  session?: string;
}

/**
 * @method Post
 * @route /auth/register
 */
export type PostRegisterUserData = PostLoginUserData & { isOwner: boolean };

/**
 * @method Post
 * @route /2fa/verify
 */
export type PostVerify2FAData = boolean;

/**
 * @method Post
 * @route /2fa/enable
 */
export type PostEnable2FAData = string;

/**
 * @method Delete
 * @route /2fa
 */
export type DeleteDisable2FAData = boolean;

/** user */
/**
 * @method Get
 * @route /user
 */
// todo: add cad properties
export type GetUserData = User & { cad: Prisma.cad };

/**
 * @method Patch
 * @route /user
 */
export type PatchUserData = User;

/**
 * @method Post
 * @route /user/logout
 */
export type PostUserLogoutData = boolean;

/**
 * @method Post
 * @route /user/password
 */
export type PostUserPasswordData = boolean;
