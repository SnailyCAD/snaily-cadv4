import { cad, WhitelistStatus } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";

export async function validateBusinessAcceptance(cad: cad, businessId: string) {
  if (cad.businessWhitelisted) {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business || business.status === WhitelistStatus.DECLINED) {
      throw new BadRequest("notFound");
    }

    if (business.status === WhitelistStatus.PENDING) {
      throw new BadRequest("businessIsPending");
    }
  }
}
