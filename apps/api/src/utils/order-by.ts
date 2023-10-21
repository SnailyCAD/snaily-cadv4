import set from "lodash.set";

export function getPrismaModelOrderBy(sorting: string) {
  return sorting.split(",").reduce((obj, cv) => {
    const [key, sortOrder] = cv.split(":") as [string, "asc" | "desc"];
    return set(obj, key, sortOrder);
  }, {});
}
