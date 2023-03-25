import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";

/** courthouse */
/**
 * @method GET
 * @route /court-entries
 */
export interface GetCourtEntriesData {
  courtEntries: Types.CourtEntry[];
  totalCount: number;
}

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
export interface GetCourthousePostsData {
  courthousePosts: Types.CourthousePost[];
  totalCount: number;
}

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
 * @method GET
 * @route /records/active-warrants
 */
export interface GetActiveWarrantsData {
  activeWarrants: (Prisma.Warrant & {
    citizen: Types.BaseCitizen;
    assignedOfficers: Types.AssignedWarrantOfficer[];
  })[];
  totalCount: number;
}

/**
 * @method POST
 * @route /records/create-warrant
 */
export type PostCreateWarrantData = GetActiveWarrantsData["activeWarrants"][number];

/**
 * @method PUT
 * @route /records/warrant/:id
 */
export type PutWarrantsData = GetActiveWarrantsData["activeWarrants"][number];

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
