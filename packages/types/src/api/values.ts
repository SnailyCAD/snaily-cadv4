import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";
import type { AnyValue } from "@snailycad/utils";
import type { PenalCodeGroup } from "../index.js";

/**
 * @method GET
 * @route /admin/values/:path
 */
export type GetValuesData<Value extends AnyValue = AnyValue> = {
  values: Value[];
  type: Prisma.ValueType;
  groups?: never;
}[];

/**
 * @method GET
 * @route /admin/values/penal_code
 */
export type GetValuesPenalCodesData = {
  type: "PENAL_CODE";
  groups: PenalCodeGroup[];
  values: (Types.PenalCode & { group: PenalCodeGroup | null })[];
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
export type DeleteValuesBulkData = boolean;

/**
 * @method DELETE
 * @route /admin/values/:path/:id
 */
export type DeleteValueByIdData = boolean;

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
