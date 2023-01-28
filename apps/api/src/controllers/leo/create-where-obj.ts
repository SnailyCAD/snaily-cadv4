import { WhitelistStatus } from "@snailycad/types";

interface CreateWhereObjOptions {
  departmentId?: string;
  query: string;
  pendingOnly: boolean;
  type: "OFFICER" | "DEPUTY";
  extraWhere?: any;
}

export function createWhereCombinedUnit(options: CreateWhereObjOptions) {
  const fieldName = options.type === "OFFICER" ? "officers" : "deputies";

  return {
    OR: [
      {
        [fieldName]: {
          some: createWhere({ ...options }),
        },
      },
    ],
  };
}

export function createWhere({
  query,
  pendingOnly,
  departmentId,
  type = "OFFICER",
  extraWhere = {},
}: CreateWhereObjOptions) {
  const [name, surname] = getName(query);

  const departmentIdWhere = departmentId ? { departmentId } : {};

  if (!query) {
    return pendingOnly
      ? {
          ...extraWhere,
          whitelistStatus: { status: WhitelistStatus.PENDING },
          ...departmentIdWhere,
        }
      : { ...extraWhere, ...departmentIdWhere };
  }

  const where: any = {
    ...(pendingOnly ? { whitelistStatus: { status: WhitelistStatus.PENDING } } : {}),
    ...extraWhere,
    OR: [
      departmentIdWhere,
      { id: query },
      { callsign: query },
      { callsign2: query },
      { department: { value: { value: { contains: query, mode: "insensitive" } } } },
      { status: { value: { value: { contains: query, mode: "insensitive" } } } },
      {
        citizen: {
          OR: [
            {
              name: { contains: name, mode: "insensitive" },
              surname: { contains: surname, mode: "insensitive" },
            },
            {
              name: { contains: name, mode: "insensitive" },
              surname: { contains: surname, mode: "insensitive" },
            },
          ],
        },
      },
    ],
  };

  if (type === "OFFICER") {
    where.OR.push({
      divisions: { some: { value: { value: { contains: query, mode: "insensitive" } } } },
    });
  }

  return where;
}

function getName(query: string) {
  try {
    return query.toString().toLowerCase().split(/ +/g);
  } catch {
    return [];
  }
}
