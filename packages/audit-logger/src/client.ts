/* eslint-disable eqeqeq */
import { hasValueObj } from "@snailycad/utils/typeguards";
import type { AuditLogActions } from "./index";

const EXCLUDED_KEYS = ["createdAt", "updatedAt"];

export function compareDifferences(action: AuditLogActions) {
  const previous = "previous" in action && action.previous != null && action.previous;
  const newData = "new" in action && action.new != null ? action.new : {};

  if (!previous) return null;

  const differences: Map<string, { key: string; previous: string; new: string }> = new Map();
  const keys = Object.keys(action.previous as object);

  for (const _key of keys) {
    const key = _key as keyof typeof previous;
    if (EXCLUDED_KEYS.includes(key)) continue;

    const previousStr = getStringFromAction(previous[key]);
    const newStr = getStringFromAction(newData[key]);

    if (previousStr && newStr && previousStr !== newStr) {
      const nameWithoutId = (key as string).replace("Id", "");

      differences.set(nameWithoutId, {
        previous: previousStr,
        new: newStr,
        key,
      });
    }
  }

  return Array.from(differences.values());
}

function getStringFromAction(value: unknown): string | null {
  if (value == null) {
    return "null";
  }

  if (["string", "number", "bigint", "boolean"].includes(typeof value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((v) => getStringFromAction(v)).join(", ");
  }

  // @ts-expect-error ignore
  if (hasValueObj(value)) {
    return value.value.value;
  }

  return null;
}
