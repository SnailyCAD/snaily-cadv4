import type { AuditLogActions } from "./actions";

const EXCLUDED_KEYS = ["createdAt", "updatedAt"];

export function compareDifferences(action: AuditLogActions) {
  if (!action.previous) return null;

  const differences: Map<string, { key: string; previous: string; new: string }> = new Map();
  const keys = Object.keys(action.previous);

  for (const _key of keys) {
    const key = _key as keyof typeof action.previous;

    if (EXCLUDED_KEYS.includes(key)) continue;
    if (typeof action.previous[key] === "object") continue;
    if (action.previous[key] !== action.new[key]) {
      differences.set(key, {
        previous: String(action.previous[key]),
        new: String(action.new[key]),
        key,
      });
    }
  }

  return Array.from(differences.values());
}
