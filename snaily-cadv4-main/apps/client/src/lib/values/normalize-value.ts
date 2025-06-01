import type { ValueType } from "@snailycad/types";

// transform: PENAL_CODES -> penalCodes
// transform: DEPARTMENT  -> department
export function normalizeValue(value: ValueType | (string & {})) {
  let split = value.toLowerCase().split(/_/);

  if (split.length > 1) {
    split = split.map((valueType, idx) => {
      if (idx > 0) {
        const firstLetter = valueType.charAt(0);

        return [firstLetter.toUpperCase(), valueType.substring(1).toLowerCase()].join("");
      }

      return valueType.toLowerCase();
    });
  }

  return split.join("");
}
