import setObject from "lodash.set";

export function parseSortString(sortString: unknown) {
  if (typeof sortString !== "string") return;
  const [id, type] = sortString.split(":");
  if (!id || !type) return;

  const path = id.replace(/-/g, ".");
  return setObject({}, path, type === "asc" ? "asc" : "desc");
}
