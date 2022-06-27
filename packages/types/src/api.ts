import type * as Prisma from "@prisma/client";
import type * as Types from "./index.js";

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

/** bleeter */
/**
 * @method Get
 * @route /bleeter
 */
export type GetBleeterData = (Prisma.BleeterPost & { user: Pick<Types.User, "username"> })[];

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
export type GetTaxiCallsData = Types.TaxiCall[];

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
export type GetTowCallsData = Types.TowCall[];

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
  userId?: Types.User["id"];
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
export type GetUserData = Types.User & { cad: Prisma.cad };

/**
 * @method Patch
 * @route /user
 */
export type PatchUserData = Types.User;

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

/**
 * @method Put
 * @route /user/api-token
 */
export type PutUserEnableDisableApiTokenData = Types.User;

/**
 * @method Delete
 * @route /user/api-token
 */
export type DeleteUserRegenerateApiTokenData = Types.User;

/** truck logs */
/**
 * @method GET
 * @route /truck-logs
 */
export interface GetTruckLogsData {
  logs: (Prisma.TruckLog & {
    citizen: Prisma.Citizen | null;
    vehicle: Omit<Types.RegisteredVehicle, "citizen"> | null;
  })[];
  registeredVehicles: Omit<Types.RegisteredVehicle, "citizen">[];
}

/**
 * @method POST
 * @route /truck-logs
 */
export type PostTruckLogsData = GetTruckLogsData["logs"][number];

/**
 * @method PUT
 * @route /truck-logs/:id
 */
export type PutTruckLogsData = GetTruckLogsData["logs"][number];

/**
 * @method DELETE
 * @route /truck-logs/:id
 */
export type DeleteTruckLogsData = boolean;

/** bolos */
/**
 * @method GET
 * @route /bolos
 */
export type GetBolosData = Types.Bolo[];

/**
 * @method POST
 * @route /bolos/:id
 */
export type PostBolosData = Types.Bolo;

/**
 * @method PUT
 * @route /bolos/:id
 */
export type PutBolosData = Types.Bolo;

/**
 * @method DELETE
 * @route /bolos/:id
 */
export type DeleteBolosData = boolean;

/**
 * @method POST
 * @route /bolos/mark-stolen/:id
 */
export type PostMarkStolenData = Prisma.Bolo;

/** citizens */
/**
 * @method GET
 * @route /citizen
 */
export interface GetCitizensData {
  citizens: (Prisma.Citizen & { user: Types.User | null })[];
  totalCount: number;
}

/**
 * @method GET
 * @route /citizen/:id
 */
export type GetCitizenByIdData = Types.Citizen;

/**
 * @method DELETE
 * @route /citizen/:id
 */
export type DeleteCitizenByIdData = boolean;

/**
 * @method POST
 * @route /citizen
 */
export type PostCitizensData = Prisma.Citizen;

/**
 * @method PUT
 * @route /citizen/:id
 */
export type PutCitizenByIdData = Prisma.Citizen & { ethnicity: Prisma.Value; gender: Prisma.Value };

/**
 * @method POST
 * @route /citizen/:id
 */
export interface PostCitizenImageByIdData {
  imageId: string | null;
}

/**
 * @method PUT
 * @route /licenses/:id
 */
export type PutCitizenLicensesByIdData = Types.Citizen;

/**
 * @method POST
 * @route /medical-records
 */
export type PostCitizenMedicalRecordsData = Prisma.MedicalRecord & {
  bloodGroup: Prisma.Value | null;
};

/**
 * @method PUT
 * @route /medical-records/:id
 */
export type PutCitizenMedicalRecordsData = Prisma.MedicalRecord & {
  bloodGroup: Prisma.Value | null;
};

/**
 * @method DELETE
 * @route /medical-records/:id
 */
export type DeleteCitizenMedicalRecordsData = boolean;

/**
 * @method GET
 * @route /vehicles/:citizenId
 */
export interface GetCitizenVehiclesData {
  totalCount: number;
  vehicles: Omit<Types.RegisteredVehicle, "citizen">[];
}

/**
 * @method POST
 * @route /vehicles
 */
export type PostCitizenVehicleData = Prisma.RegisteredVehicle & {
  model: Types.VehicleValue;
  registrationStatus: Prisma.Value;
  citizen: Prisma.Citizen;
};

/**
 * @method PUT
 * @route /vehicles/:id
 */
export type PutCitizenVehicleData = Prisma.RegisteredVehicle & {
  model: Types.VehicleValue;
  registrationStatus: Prisma.Value;
};

/**
 * @method POST
 * @route /vehicles/:id
 */
export type PostCitizenTransferVehicleData = Prisma.RegisteredVehicle;

/**
 * @method DELETE
 * @route /vehicles/:id
 */
export type DeleteCitizenVehicleData = boolean;

/**
 * @method GET
 * @route /weapons/:citizenId
 */
export interface GetCitizenWeaponsData {
  totalCount: number;
  weapons: Omit<Types.Weapon, "citizen">[];
}

/**
 * @method POST
 * @route /weapons
 */
export type PostCitizenWeaponData = Omit<Types.Weapon, "citizen">;

/**
 * @method PUT
 * @route /weapons/:id
 */
export type PutCitizenWeaponData = PostCitizenWeaponData;

/**
 * @method DELETE
 * @route /weapons/:id
 */
export type DeleteCitizenWeaponData = boolean;

/** businesses */
/**
 * @method GET
 * @route /businesses
 */
export interface GetBusinessesData {
  businesses: (Types.Employee & { business: Prisma.Business })[];
  joinableBusinesses: Prisma.Business[];
}

/**
 * @method GET
 * @route /businesses/:id
 */
export type GetBusinessByIdData = Prisma.Business & {
  businessPosts: Prisma.BusinessPost[];
  vehicles: Types.RegisteredVehicle[];
  employees: Omit<GetBusinessesData["businesses"][number], "business">[];
  citizen: Pick<Prisma.Citizen, "name" | "surname" | "id">;
  employee: Types.Employee | null;
};

/**
 * @method PUT
 * @route /businesses/:id
 */
export type PutBusinessByIdData = Prisma.Business;

/**
 * @method DELETE
 * @route /businesses/:id
 */
export type DeleteBusinessByIdData = boolean;

/**
 * @method POST
 * @route /businesses/join
 */
export type PostJoinBusinessData = GetBusinessesData["businesses"][number];

/**
 * @method POST
 * @route /businesses/create
 */
export interface PostCreateBusinessData {
  business: Prisma.Business;
  id: Prisma.Business["id"];
  employee: GetBusinessesData["businesses"][number];
}

/**
 * @method PUT
 * @route /businesses/employees/:businessId/:id
 */
export type PutBusinessEmployeesData = GetBusinessesData["businesses"][number];

/**
 * @method DELETE
 * @route /businesses/employees/:businessId/:id
 */
export type DeleteBusinessFireEmployeeData = boolean;

/**
 * @method POST
 * @route /businesses/employees/:businessId/:id/:type
 */
export type PostBusinessAcceptDeclineData = Prisma.Employee;

/**
 * @method POST
 * @route /businesses/posts/:id
 */
export type PostBusinessPostsData = Prisma.BusinessPost;

/**
 * @method PUT
 * @route /businesses/posts/:id
 */
export type PutBusinessPostsData = Prisma.BusinessPost;

/**
 * @method DELETE
 * @route /businesses/posts/:id
 */
export type DeleteBusinessPostsData = boolean;
