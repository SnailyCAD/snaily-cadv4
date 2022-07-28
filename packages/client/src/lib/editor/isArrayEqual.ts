import isEqual from "lodash/isEqual";
import isEmpty from "lodash/isEmpty";
import xorWith from "lodash/xorWith";

export function isArrayEqual<T>(x: T[], y: T[]) {
  return isEmpty(xorWith(x, y, isEqual));
}
