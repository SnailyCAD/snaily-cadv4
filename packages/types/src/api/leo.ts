import type * as Types from "../index.js";

/**
 * @method GET
 * @route /leo
 */
export interface GetMyOfficersData {
  officers: (Types.Officer & {
    qualifications: Types.UnitQualification[];
  })[];
  totalCount: number;
}

/**
 * @method POST
 * @route /leo
 */
export type PostMyOfficersData = GetMyOfficersData["officers"][number];

/**
 * @method PUT
 * @route /leo/:id
 */
export type PutMyOfficerByIdData = GetMyOfficersData["officers"][number];

/**
 * @method DELETE
 * @route /leo/:id
 */
export type DeleteMyOfficerByIdData = boolean;

/**
 * @method GET
 * @route /leo/logs
 */
export interface GetMyOfficersLogsData {
  logs: (Types.OfficerLog & { officer: Types.Officer | null })[];
  totalCount: number;
}

/**
 * @method POST
 * @route /leo/image/:id
 */
export interface PostMyOfficerByIdData {
  imageId: string | null;
}

/** dmv */
/**
 * @method GET
 * @route /leo/dmv
 */
export interface GetDMVPendingVehiclesData {
  vehicles: Types.RegisteredVehicle[];
  totalCount: number;
}

/**
 * @method POST
 * @route /leo/dmv/:vehicleId
 */
export type PostDMVVehiclesData = Types.RegisteredVehicle;

/** bureau of firearms */
/**
 * @method GET
 * @route /leo/bureau-of-firearms
 */
export interface GetPendingBOFWeapons {
  weapons: Types.Weapon[];
  totalCount: number;
}

/**
 * @method POST
 * @route /leo/bureau-of-firearms/:vehicleId
 */
export type PostBOFData = Types.Weapon;

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

/** license-exams */
/**
 * @method GET
 * @route /leo/license-exams
 */
export interface GetLicenseExamsData {
  totalCount: number;
  exams: Types.LicenseExam[];
}

/**
 * @method POST
 * @route /leo/license-exams
 */
export type PostLicenseExamsData = Types.LicenseExam;

/**
 * @method PUT
 * @route /leo/license-exams/:id
 */
export type PutLicenseExamByIdData = Types.LicenseExam;

/**
 * @method DELETE
 * @route /leo/license-exams/:id
 */
export type DeleteLicenseExamByIdData = boolean;

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
