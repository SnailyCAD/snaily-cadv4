import type { AuditLogActions } from "./actions";
import { hasValueObj } from "@snailycad/utils/typeguards";

const EXCLUDED_KEYS = ["createdAt", "updatedAt"];

export function compareDifferences(action: AuditLogActions) {
  if (!action.previous) return null;

  const differences: Map<string, { key: string; previous: string; new: string }> = new Map();
  const keys = Object.keys(action.previous);

  for (const _key of keys) {
    const key = _key as keyof typeof action.previous;
    if (EXCLUDED_KEYS.includes(key)) continue;

    const previousStr = getStringFromAction(action.previous[key]);
    const newStr = getStringFromAction(action.new[key]);

    if (previousStr && newStr && previousStr !== newStr) {
      const nameWithoutId = key.replace("Id", "");

      differences.set(nameWithoutId, {
        previous: previousStr,
        new: newStr,
        key,
      });
    }
  }

  return Array.from(differences.values());
}

function getStringFromAction(value: unknown) {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return "null";
  }

  if (["string", "number", "bigint", "boolean"].includes(typeof value)) {
    return String(value);
  }

  // @ts-expect-error ignore
  if (hasValueObj(value)) {
    return value.value.value;
  }

  return null;
}
