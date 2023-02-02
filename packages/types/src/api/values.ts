import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";
import type { PenalCodeGroup, AnyValue } from "../index.js";

/**
 * @method GET
 * @route /admin/values/:path
 */
export type GetValuesData<Value extends AnyValue = AnyValue> = {
  values: Value[];
  type: Prisma.ValueType;
  totalCount: number;
}[];

/**
 * @method GET
 * @route /admin/values/:path/export
 */
export type GetValuesExportData<Value extends AnyValue = AnyValue> = Value[];

/**
 * @method GET
 * @route /admin/values/penal_code
 */
export type GetValuesPenalCodesData = {
  type: "PENAL_CODE";
  values: (Types.PenalCode & { group: PenalCodeGroup | null })[];
  totalCount: number;
}[];

/**
 * @method POST
 * @route /admin/values/:path
 */
export type PostValuesData<Value extends AnyValue = AnyValue> = Value;

/**
 * @method DELETE
 * @route /admin/values/:path/bulk-delete
 */
export interface DeleteValuesBulkData {
  failed: number;
  success: number;
}

/**
 * @method DELETE
 * @route /admin/values/:path/:id
 */
export type DeleteValueByIdData = boolean | string;

/**
 * @method PATCH
 * @route /admin/values/:path
 */
export type PatchValueByIdData<Value extends AnyValue = AnyValue> = Value;

/**
 * @method PUT
 * @route /admin/values/:path/positions
 */
export type PutValuePositionsData = boolean;

/** import  */
/**
 * @method GET
 * @route /admin/values/import/:path
 */
export type ImportValuesData<Value extends AnyValue = AnyValue> = Value[];

/**
 * @method Get
 * @route /admin/penal-code-group
 */
export interface GetPenalCodeGroupsData {
  groups: Types.PenalCodeGroup[];
  totalCount: number;
}

/**
 * @method POST
 * @route /admin/penal-code-group
 */
export type PostPenalCodeGroupsData = Types.PenalCodeGroup;

/**
 * @method PUT
 * @route /admin/penal-code-group/:id
 */
export type PutPenalCodeGroupsData = Types.PenalCodeGroup;

/**
 * @method DELETE
 * @route /admin/penal-code-group/:id
 */
export type DeletePenalCodeGroupsData = boolean;
