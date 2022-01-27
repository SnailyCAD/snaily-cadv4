import { cad, WhitelistStatus } from "@prisma/client";
import type { Context } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";

export async function validateBusinessAcceptance(ctx: Context, businessId: string) {
  const cad = ctx.get("cad") as cad | null;
  if (!cad) {
    throw new BadRequest("cadNotFound");
  }

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
