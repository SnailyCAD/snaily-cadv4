import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";

/**
 * @method GET
 * @route /ems-fd
 */
export interface GetMyDeputiesData {
  deputies: (Types.EmsFdDeputy & {
    qualifications: Types.UnitQualification[];
  })[];
}

/**
 * @method POST
 * @route /ems-fd
 */
export type PostMyDeputiesData = GetMyDeputiesData["deputies"][number];

/**
 * @method PUT
 * @route /ems-fd/:id
 */
export type PutMyDeputyByIdData = GetMyDeputiesData["deputies"][number];

/**
 * @method DELETE
 * @route /ems-fd/:id
 */
export type DeleteMyDeputyByIdData = boolean;

/**
 * @method GET
 * @route /ems-fd/logs
 */
export interface GetMyDeputiesLogsData {
  logs: (Types.OfficerLog & {
    emsFdDeputy: Types.EmsFdDeputy | null;
  })[];
  totalCount: number;
}

/**
 * @method POST
 * @route /ems-fd/image/:id
 */
export interface PostMyDeputyByIdData {
  imageId: string | null;
}

/** actions */
/**
 * @method POST
 * @route /ems-fd/panic-button
 */
export type PostEmsFdTogglePanicButtonData = Types.EmsFdDeputy;

/**
 * @method POST
 * @route /ems-fd/declare/:citizenId
 */
export type PostEmsFdDeclareCitizenById = Prisma.Citizen;

/**
 * @method POST
 * @route /ems-fd/medical-record
 */
export type PostEmsFdMedicalRecord = Types.MedicalRecord;

/**
 * @method GET
 * @route /ems-fd/active-deputy
 */
export type GetEmsFdActiveDeputy = Types.EmsFdDeputy;

/**
 * @method GET
 * @route /ems-fd/active-deputies
 */
export type GetEmsFdActiveDeputies = (Types.EmsFdDeputy | Types.CombinedEmsFdUnit)[];
