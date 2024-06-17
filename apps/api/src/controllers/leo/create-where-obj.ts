import { Prisma } from "@prisma/client";
import { WhitelistStatus } from "@snailycad/types";

interface CreateWhereObjOptions<Type extends "OFFICER" | "DEPUTY"> {
  departmentId?: string;
  query: string;
  pendingOnly: boolean;
  type: Type;
  extraWhere?: Type extends "OFFICER" ? Prisma.OfficerWhereInput : Prisma.EmsFdDeputyWhereInput;
}

export function createWhereCombinedUnit<Type extends "OFFICER" | "DEPUTY">(
  options: CreateWhereObjOptions<Type>,
) {
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

export function createWhere<Type extends "OFFICER" | "DEPUTY">({
  query,
  pendingOnly,
  departmentId,
  type,
  extraWhere = {},
}: CreateWhereObjOptions<Type>) {
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

  const where = {
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
      { user: { username: { contains: query, mode: Prisma.QueryMode.insensitive } } },
      type === "OFFICER"
        ? {
            divisions: { some: { value: { value: { contains: query, mode: "insensitive" } } } },
          }
        : {},
    ],
  } satisfies Type extends "OFFICER" ? Prisma.OfficerWhereInput : Prisma.EmsFdDeputyWhereInput;

  return where;
}

function getName(query: string) {
  try {
    return query.toString().toLowerCase().split(/ +/g);
  } catch {
    return [];
  }
}
