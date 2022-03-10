import { prisma } from "lib/prisma";

export async function valueToFlagValue() {
  const values = await prisma.value.findMany({
    where: { type: "VEHICLE_FLAG" },
  });
}
