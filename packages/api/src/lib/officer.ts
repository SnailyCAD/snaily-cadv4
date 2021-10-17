import { Cookie } from "@snailycad/config";
import { Req } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { parse } from "cookie";
import { verifyJWT } from "../utils/jwt";
import { prisma } from "./prisma";

export async function getActiveOfficer(req: Req, userId: string) {
  const header = req.headers.cookie;
  if (!header) {
    throw new BadRequest("noActiveOfficer");
  }

  const cookie = parse(header)[Cookie.ActiveOfficer];
  const jwtPayload = verifyJWT(cookie!);

  if (!jwtPayload) {
    throw new BadRequest("noActiveOfficer");
  }

  const officer = await prisma.officer.findFirst({
    where: {
      userId,
      id: jwtPayload.officerId,
    },
    include: {
      rank: true,
      department: true,
      status2: {
        include: {
          value: true,
        },
      },
    },
  });

  if (!officer) {
    throw new BadRequest("noActiveOfficer");
  }

  return officer;
}
