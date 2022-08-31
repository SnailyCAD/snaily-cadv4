import type * as Types from "../index.js";

/**
 * @method GET
 * @route /my-officers
 */
export interface GetMyOfficersData {
  officers: (Types.Officer & {
    qualifications: Types.UnitQualification[];
  })[];
}

/**
 * @method POST
 * @route /my-officers
 */
export type PostMyOfficersData = GetMyOfficersData["officers"][number];

/**
 * @method PUT
 * @route /my-officers/:id
 */
export type PutMyOfficerByIdData = GetMyOfficersData["officers"][number];

/**
 * @method DELETE
 * @route /my-officers/:id
 */
export type DeleteMyOfficerByIdData = boolean;

/**
 * @method GET
 * @route /my-officers/logs
 */
export interface GetMyOfficersLogsData {
  logs: (Types.OfficerLog & { officer: Types.Officer | null })[];
  totalCount: number;
}

/**
 * @method POST
 * @route /my-officers/image/:id
 */
export interface PostMyOfficerByIdData {
  imageId: string | null;
}

/** dmv */
/**
 * @method GET
 * @route /leo/dmv
 */
export type GetDMVPendingVehiclesData = Types.RegisteredVehicle[];

/**
 * @method POST
 * @route /leo/dmv/:vehicleId
 */
export type PostDMVVehiclesData = Types.RegisteredVehicle;

/** jail */
/**
 * @method GET
 * @route /leo/jail
 */
export interface GetJailedCitizensData {
  totalCount: number;
  jailedCitizens: (Types.BaseCitizen & { Record: Types.Record[] })[];
}

/**
 * @method DELETE
 * @route /leo/jail/:id
 */
export type DeleteReleaseJailedCitizenData = Types.BaseCitizen & { Record: Types.Record[] };

/** dl-exams */
/**
 * @method GET
 * @route /leo/dl-exams
 */
export interface GetDLExamsData {
  totalCount: number;
  exams: Types.DLExam[];
}

/**
 * @method POST
 * @route /leo/dl-exams
 */
export type PostDLExamsData = Types.DLExam;

/**
 * @method PUT
 * @route /leo/dl-exams/:id
 */
export type PutDLExamByIdData = Types.DLExam;

/**
 * @method DELETE
 * @route /leo/dl-exams/:id
 */
export type DeleteDLExamByIdData = boolean;

/** weapon-exams */
/**
 * @method GET
 * @route /leo/weapon-exams
 */
export interface GetWeaponExamsData {
  totalCount: number;
  exams: Types.WeaponExam[];
}

/**
 * @method POST
 * @route /leo/weapon-exams
 */
export type PostWeaponExamsData = Types.WeaponExam;

/**
 * @method PUT
 * @route /leo/weapon-exams/:id
 */
export type PutWeaponExamByIdData = Types.WeaponExam;

/**
 * @method DELETE
 * @route /leo/weapon-exams/:id
 */
export type DeleteWeaponExamByIdData = boolean;

/** leo */
/**
 * @method GET
 * @route /leo/active-officer
 */
export type GetActiveOfficerData = Types.CombinedLeoUnit | Types.Officer;

/**
 * @method GET
 * @route /leo/active-officers
 */
export type GetActiveOfficersData = (Types.CombinedLeoUnit | Types.Officer)[];

/**
 * @method POST
 * @route /leo/panic-button
 */
export type PostLeoTogglePanicButtonData = Types.CombinedLeoUnit | Types.Officer;

/**
 * @method GET
 * @route /leo/impounded-vehicles
 */
export type GetLeoImpoundedVehiclesData = Types.ImpoundedVehicle[];

/**
 * @method DELETE
 * @route /leo/impounded-vehicles/:id
 */
export type DeleteLeoCheckoutImpoundedVehicleData = boolean;

/**
 * @method GET
 * @route /leo/qualifications/:unitId
 */
export type GetUnitQualificationsByUnitIdData = Types.UnitQualification[];

/**
 * @method PUT
 * @route /leo/callsign/:officerId
 */
export type PutLeoCallsignData = Types.Officer;
