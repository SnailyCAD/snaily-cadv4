import type * as Prisma from "@prisma/client";
import type * as Types from "./index.js";

export * from "./api/admin.js";

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

/** courthouse */
/**
 * @method GET
 * @route /court-entries
 */
export type GetCourtEntriesData = Types.CourtEntry[];

/**
 * @method POST
 * @route /court-entries
 */
export type PostCourtEntriesData = Types.CourtEntry;

/**
 * @method PUT
 * @route /court-entries/:id
 */
export type PutCourtEntriesData = Types.CourtEntry;

/**
 * @method DELETE
 * @route /court-entries/:id
 */
export type DeleteCourtEntriesData = boolean;

/**
 * @method GET
 * @route /courthouse-posts
 */
export type GetCourthousePostsData = Types.CourthousePost[];

/**
 * @method POST
 * @route /courthouse-posts
 */
export type PostCourthousePostsData = Types.CourthousePost;

/**
 * @method PUT
 * @route /courthouse-posts/:id
 */
export type PutCourthousePostsData = Types.CourthousePost;

/**
 * @method DELETE
 * @route /courthouse-posts/:id
 */
export type DeleteCourthousePostsData = boolean;

/**
 * @method GET
 * @route /expungement-requests
 */
export type GetExpungementRequestsData = (Prisma.ExpungementRequest & {
  citizen: Prisma.Citizen;
  warrants: Prisma.Warrant[];
  records: Omit<Types.Record, "seizedItems" | "officer">[];
})[];

/**
 * @method GET
 * @route /expungement-requests/:citizenId
 */
export type GetExpungementRequestByCitizenIdData = Types.Citizen & {
  warrants: Prisma.Warrant[];
  Record: Omit<Types.Record, "seizedItems">[];
};

/**
 * @method POST
 * @route /expungement-requests/:citizenId
 */
export type PostExpungementRequestByCitizenIdData = GetExpungementRequestsData[number];

/**
 * @method GET
 * @route /name-change-requests
 */
export type GetNameChangeRequestsData = (Prisma.NameChangeRequest & {
  citizen: Prisma.Citizen;
})[];

/**
 * @method POST
 * @route /name-change-requests
 */
export type PostNameChangeRequestsData = GetNameChangeRequestsData[number];

/**
 * @method POST
 * @route /records/create-warrant
 */
export type PostCreateWarrantData = Prisma.Warrant & {
  citizen: Prisma.Citizen;
};

/**
 * @method PUT
 * @route /records/create-warrant/:id
 */
export type PutWarrantsData = PostCreateWarrantData;

/**
 * @method POST
 * @route /records
 */
export type PostRecordsData = Types.Record;

/**
 * @method PUT
 * @route /records/:id
 */
export type PutRecordsByIdData = Types.Record;

/**
 * @method DELETE
 * @route /records/:id
 */
export type DeleteRecordsByIdData = boolean;

/** calls */
/**
 * @method GET
 * @route /911-calls
 */
export type Get911CallsData = (Types.Call911 & {
  assignedUnits: Types.AssignedUnit[];
  events: Types.Call911Event[];
})[];

/**
 * @method GET
 * @route /911-calls/:id
 */
export type Get911CallByIdData = Get911CallsData[number];

/**
 * @method POST
 * @route /911-calls
 */
export type Post911CallsData = Get911CallsData[number];

/**
 * @method PUT
 * @route /911-calls/:id
 */
export type Put911CallByIdData = Get911CallsData[number];

/**
 * @method DELETE
 * @route /911-calls/purge
 */
export type DeletePurge911CallsData = boolean;

/**
 * @method DELETE
 * @route /911-calls/:id
 */
export type Delete911CallByIdData = boolean;

/**
 * @method POST
 * @route /911-calls/link-incident/:callId
 */
export type PostLink911CallToIncident =
  | (Prisma.Call911 & { incidents: Types.LeoIncident[] })
  | null;

/**
 * @method POST
 * @route /911-calls/:type/:callId
 */
export type Post911CallAssignUnAssign = Get911CallsData[number];

/**
 * @method POST
 * @route /911-calls/events
 */
export type Post911CallEventsData = Get911CallsData[number];

/**
 * @method PUT
 * @route /911-calls/events/:id
 */
export type Put911CallEventByIdData = Get911CallsData[number];

/**
 * @method DELETE
 * @route /911-calls/events/:id
 */
export type Delete911CallEventByIdData = Get911CallsData[number];

/** dispatch */
/**
 * @method GET
 * @route /dispatch
 */
export interface GetDispatchData {
  deputies: Types.EmsFdDeputy[];
  officers: (Types.Officer | Types.CombinedLeoUnit)[];
  activeIncidents: Types.LeoIncident[];
  activeDispatchers: (Prisma.ActiveDispatchers & {
    user: Pick<Types.User, "id" | "rank" | "username" | "isLeo" | "isEmsFd">;
  })[];
}

/**
 * @method POST
 * @route /dispatch/aop
 */
export type PostDispatchAopData = Pick<Types.cad, "areaOfPlay">;

/**
 * @method POST
 * @route /dispatch/signal-100
 */
export interface PostDispatchSignal100Data {
  value: boolean;
}

/**
 * @method POST
 * @route /dispatch/dispatchers-state
 */
export interface PostDispatchDispatchersStateData {
  dispatcher: GetDispatchData["activeDispatchers"][number] | null;
}

/**
 * @method PUT
 * @route /dispatch/radio-channel
 */
export type PutDispatchRadioChannelData = Types.Officer | Types.EmsFdDeputy | Types.CombinedLeoUnit;

/**
 * @method POST
 * @route /dispatch/radio-channel
 */
export type PostDispatchTonesData = boolean;
