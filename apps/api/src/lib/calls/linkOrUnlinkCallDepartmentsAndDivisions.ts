import type { DepartmentValue, DivisionValue } from "@prisma/client";
import { prisma } from "lib/data/prisma";
import { manyToManyHelper } from "lib/data/many-to-many";

interface Options {
  call: { id: string; departments: { id: string }[]; divisions: { id: string }[] };
  departments: (DepartmentValue["id"] | DepartmentValue)[];
  divisions: (DivisionValue["id"] | DivisionValue)[];
}

export async function linkOrUnlinkCallDepartmentsAndDivisions({
  call,
  departments,
  divisions,
}: Options) {
  const departmentDisconnectConnectArr = manyToManyHelper(
    call.departments,
    departments.map(normalizeId),
    { accessor: "id" },
  );

  const divisionDisconnectConnectArr = manyToManyHelper(
    call.divisions,
    divisions.map(normalizeId),
    { accessor: "id" },
  );

  await prisma.$transaction([
    ...departmentDisconnectConnectArr.map((v) =>
      prisma.call911.update({
        where: { id: call.id },
        data: { departments: v },
      }),
    ),
    ...divisionDisconnectConnectArr.map((v) =>
      prisma.call911.update({
        where: { id: call.id },
        data: { divisions: v },
      }),
    ),
  ]);
}

function normalizeId(value: string | { id: string }) {
  return typeof value === "string" ? { id: value } : value;
}
