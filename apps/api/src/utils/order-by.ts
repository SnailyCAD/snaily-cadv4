import set from "lodash.set";

export function getPrismaModelOrderBy(sorting: string) {
  return sorting.split(",").reduce((obj, cv) => {
    const [key, sortOrder] = cv.split(":") as [string, "asc" | "desc"];
    return set(obj, key, sortOrder);
  }, {});
}

export function getFirstOrderBy(sorting: string) {
  const [first] = sorting.split(",");
  if (!first) return null;

  const [key, sortOrder] = first.split(":") as [string, "asc" | "desc"];
  return [key, sortOrder] as const;
}
