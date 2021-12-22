import { User } from "@prisma/client";
import { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { unitProperties } from "./officer";
import { prisma } from "./prisma";

export async function getActiveDeputy(req: Req, user: User, ctx: Context) {
  // dispatch is allowed to use ems-fd routes
  let isDispatch = false;
  if (req.headers["is-from-dispatch"]?.toString() === "true") {
    if (!user.isDispatch) {
      throw new Unauthorized("Must be dispatch to use this header.");
    } else {
      isDispatch = true;
    }
  } else {
    if (!user.isEmsFd) {
      throw new Forbidden("Invalid Permissions");
    }
  }

  const deputy = await prisma.emsFdDeputy.findFirst({
    where: {
      userId: user.id,
      NOT: {
        status: {
          shouldDo: "SET_OFF_DUTY",
        },
      },
    },
    include: unitProperties,
  });

  if (!deputy) {
    ctx.delete("activeDeputy");
  }

  if (!isDispatch && !deputy) {
    throw new BadRequest("noActiveDeputy");
  }

  return isDispatch ? null : deputy;
}
