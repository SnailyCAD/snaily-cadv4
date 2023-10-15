import type * as Prisma from "./prisma/index";
import type * as Types from "./index.js";
import type { GetEmsFdActiveDeputy } from "./api.js";
import type { GetActiveOfficerData } from "./api.js";

export * from "./api/admin.js";
export * from "./api/dispatch.js";
export * from "./api/courthouse.js";
export * from "./api/search.js";
export * from "./api/leo.js";
export * from "./api/ems-fd.js";
export * from "./api/cad-settings.js";
export * from "./api/values.js";
export * from "./api/bleeter.js";

/** taxi */
/**
 * @method Get
 * @route /taxi
 */
export interface GetTaxiCallsData {
  calls: Types.TaxiCall[];
  totalCount: number;
}

/**
 * @method Post
 * @route /taxi
 */
export type PostTaxiCallsData = GetTaxiCallsData["calls"][number];

/**
 * @method Put
 * @route /taxi/:id
 */
export type PutTaxiCallsData = GetTaxiCallsData["calls"][number];

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
export interface GetTowCallsData {
  calls: Types.TowCall[];
  totalCount: number;
}

/**
 * @method Post
 * @route /tow
 */
export type PostTowCallsData = GetTowCallsData["calls"][number];

/**
 * @method Put
 * @route /tow/:id
 */
export type PutTowCallsData = GetTowCallsData["calls"][number];

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
export type PostRegisterUserData = PostLoginUserData & {
  isOwner: boolean;
  whitelistStatus?: Types.WhitelistStatus;
};

/**
 * @method Post
 * @route /2fa/verify
 */
export type PostVerify2FAData = boolean;

/**
 * @method Post
 * @route /2fa/enable
 */
export interface PostEnable2FAData {
  qrCode: string;
  totpCode: string;
}

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
export type GetUserData = Types.User & {
  apiToken?: Prisma.ApiToken | null;
  cad: Prisma.cad;
  unit?: GetActiveOfficerData | GetEmsFdActiveDeputy | null;
};

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
export type PutUserEnableDisableApiTokenData = Types.User & {
  apiToken?: Prisma.ApiToken | null;
};

/**
 * @method Delete
 * @route /user/api-token
 */
export type DeleteUserRegenerateApiTokenData = Types.User & {
  apiToken?: Prisma.ApiToken | null;
};

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
  totalCount: number;
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
export interface GetBolosData {
  bolos: Types.Bolo[];
  totalCount: number;
}

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
export type PostMarkStolenData = Prisma.Bolo | true;

/** citizens */
type CitizenProperties =
  | "id"
  | "name"
  | "surname"
  | "userId"
  | "socialSecurityNumber"
  | "imageId"
  | "imageBlurData";

/**
 * @method GET
 * @route /citizen
 */
export interface GetCitizensData {
  citizens: (Pick<Prisma.Citizen, CitizenProperties> & { user: Types.User | null })[];
  totalCount: number;
}

/**
 * @method GET
 * @route /citizen/:id
 */
export type GetCitizenByIdData = Types.Citizen;

/**
 * @method GET
 * @route /citizen/:id/records
 */
export type GetCitizenByIdRecordsData = Types.Record[];

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
export type PutCitizenByIdData = Prisma.Citizen & {
  ethnicity?: Prisma.Value | null;
  gender?: Prisma.Value | null;
};

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
  citizen?: Prisma.Citizen | null;
  trimLevels?: Prisma.Value[];
};

/**
 * @method PUT
 * @route /vehicles/:id
 */
export type PutCitizenVehicleData = Prisma.RegisteredVehicle & {
  model: Types.VehicleValue;
  registrationStatus: Prisma.Value;
  trimLevels?: Prisma.Value[];
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
  ownedBusinesses: (Types.Employee & { business: Prisma.Business })[];
  joinedBusinesses: (Types.Employee & { business: Prisma.Business })[];
  joinableBusinesses: Prisma.Business[];
}

/**
 * @method GET
 * @route /businesses/:id
 */
export type GetBusinessByIdData = Prisma.Business & {
  businessPosts: Prisma.BusinessPost[];
  vehicles: Types.RegisteredVehicle[];
  employees: Omit<GetBusinessesData["ownedBusinesses"][number], "business">[];
  employee: Types.Employee | null;
  roles: (Prisma.EmployeeValue & { value: Prisma.Value })[];
};

/**
 * @method GET
 * @route /businesses/:id/roles
 */
export interface GetBusinessRolesByBusinessIdData {
  roles: (Prisma.EmployeeValue & { value: Prisma.Value })[];
  totalCount: number;
}

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
export type PostJoinBusinessData = GetBusinessesData["ownedBusinesses"][number];

/**
 * @method POST
 * @route /businesses/create
 */
export interface PostCreateBusinessData {
  business: Prisma.Business;
  id: Prisma.Business["id"];
  employee: GetBusinessesData["ownedBusinesses"][number];
}

/**
 * @method PUT
 * @route /businesses/employees/:businessId/:id
 */
export type PutBusinessEmployeesData = GetBusinessesData["ownedBusinesses"][number];

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

/** incidents */
/**
 * @method GET
 * @route /incidents
 */
export interface GetIncidentsData<Type extends "ems-fd" | "leo"> {
  totalCount: number;
  incidents: Type extends "ems-fd" ? Types.EmsFdIncident[] : Types.LeoIncident[];
}

/**
 * @method GET
 * @route /incidents/:id
 */
export type GetIncidentByIdData<Type extends "ems-fd" | "leo"> = Type extends "ems-fd"
  ? Types.EmsFdIncident
  : Types.LeoIncident;

/**
 * @method POST
 * @route /incidents
 */
export type PostIncidentsData<Type extends "ems-fd" | "leo"> = Type extends "ems-fd"
  ? Types.EmsFdIncident
  : Types.LeoIncident;

/**
 * @method PUT
 * @route /incidents/:type/:incidentId
 */
export type PutAssignUnassignIncidentsData<Type extends "ems-fd" | "leo"> = Type extends "ems-fd"
  ? Types.EmsFdIncident
  : Types.LeoIncident;

/**
 * @method PUT
 * @route /incidents/:id
 */
export type PutIncidentByIdData<Type extends "ems-fd" | "leo"> = Type extends "ems-fd"
  ? Types.EmsFdIncident
  : Types.LeoIncident;

/**
 * @method DELETE
 * @route /incidents/:id
 */
export type DeleteIncidentByIdData = boolean;

/**
 * @method POST
 * @route /incidents/events/:incidentId
 */
export type PostIncidentEventsData = Types.LeoIncident;

/**
 * @method PUT
 * @route /incidents/events/:incidentId/:eventId
 */
export type PutIncidentEventByIdData = Types.LeoIncident;

/**
 * @method DELETE
 * @route /incidents/events/:incidentId/:eventId
 */
export type DeleteIncidentEventByIdData = Types.LeoIncident;

/** notes */
/**
 * @method POST
 * @route /notes
 */
export type PostNotesData = Types.Note;

/**
 * @method PUT
 * @route /notes/:id
 */
export type PutNotesData = Types.Note;

/**
 * @method DELETE
 * @route /notes/:id
 */
export type DeleteNotesData = boolean;

/** pets */
/**
 * @method GET
 * @route /pets
 */
export interface GetUserPetsData {
  totalCount: number;
  pets: Types.Pet[];
}

/**
 * @method GET
 * @route /pets/:id
 */
export type GetPetByIdData = Types.Pet;

/**
 * @method POST
 * @route /pets
 */
export type PostPetsData = Types.Pet;

/**
 * @method POST
 * @route /pets/:petId/medical-records
 */
export type PostPetByIdMedicalRecordsData = Types.PetMedicalRecord;

/**
 * @method PUT
 * @route /pets/:petId/medical-records/:id
 */
export type PutPetByIdMedicalRecordsData = Types.PetMedicalRecord;

/**
 * @method DELETE
 * @route /pets/:petId/medical-records/:id
 */
export type DeletePetByIdMedicalRecordsData = boolean;

/**
 * @method POST
 * @route /pets/:petId/notes
 */
export type PostPetByIdNotesData = Types.Note;

/**
 * @method PUT
 * @route /pets/:petId/notes/:id
 */
export type PutPetByIdNotesData = Types.Note;

/**
 * @method DELETE
 * @route /pets/:petId/notes/:id
 */
export type DeletePetByIdNotesData = boolean;
