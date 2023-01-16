import type { Prisma } from "@prisma/client";
import { WhitelistStatus } from "@snailycad/types";

export function createWhere(
  {
    query,
    pendingOnly,
    departmentId,
  }: { departmentId?: string; query: string; pendingOnly: boolean },
  type: "OFFICER" | "DEPUTY" | "COMBINED_UNIT" = "OFFICER",
) {
  const [name, surname] = query.toString().toLowerCase().split(/ +/g);

  const departmentIdWhere = departmentId ? { departmentId } : {};

  if (type === "COMBINED_UNIT") {
    return {
      OR: [
        {
          officers: {
            some: createWhere({ query, pendingOnly, departmentId }, "OFFICER"),
          },
        },
      ],
    } as Prisma.CombinedLeoUnitWhereInput;
  }

  if (!query) {
    return pendingOnly
      ? {
          whitelistStatus: { status: WhitelistStatus.PENDING },
          ...departmentIdWhere,
        }
      : departmentIdWhere;
  }

  const where: any = {
    ...(pendingOnly ? { whitelistStatus: { status: WhitelistStatus.PENDING } } : {}),
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
