import { User } from ".prisma/client";
import { Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { Forbidden } from "@tsed/exceptions";
import { getSessionUser } from "../lib/auth";

@Middleware()
export class IsAdmin implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    await admin(user);
  }
}

@Middleware()
export class IsSupervisor implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    const isSupervisor = await supervisor(user);

    if (!isSupervisor) {
      await admin(user);
    }
  }
}

@Middleware()
export class IsOwner implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    if (user.rank !== "OWNER") {
      throw new Forbidden("Invalid Permissions");
    }
  }
}

@Middleware()
export class IsDispatch implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    if (!user.isDispatch) {
      throw new Forbidden("Invalid Permissions");
    }
  }
}

@Middleware()
export class IsEmsFd implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    if (!user.isEmsFd) {
      throw new Forbidden("Invalid Permissions");
    }
  }
}

@Middleware()
export class IsLeo implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    if (!user.isLeo) {
      throw new Forbidden("Invalid Permissions");
    }
  }
}

async function admin(user: Pick<User, "rank">) {
  if (!["OWNER", "ADMIN"].includes(user.rank)) {
    throw new Forbidden("Invalid Permissions");
  }

  return true;
}

async function supervisor(user: Pick<User, "isSupervisor">) {
  if (!user.isSupervisor) {
    throw new Forbidden("Invalid Permissions");
  }

  return true;
}
