import { Res, Controller, UseBeforeEach, Req } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, UPDATE_OFFICER_STATUS_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { ShouldDoType } from ".prisma/client";
import { setCookie } from "../../utils/setCookie";
import { Cookie } from "@snailycad/config";
import { IsAuth } from "../../middlewares";
import { parse } from "cookie";
import { signJWT, verifyJWT } from "../../utils/jwt";

// todo: check for leo permissions
@Controller("/leo")
@UseBeforeEach(IsAuth)
export class LeoController {
  @Get("/")
  async getUserOfficers(@Context() ctx: Context) {
    const officers = await prisma.officer.findMany({
      where: {
        userId: ctx.get("user").id,
      },
      include: {
        department: true,
      },
    });

    return officers;
  }

  @Post("/")
  async createOfficer(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_OFFICER_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const officer = await prisma.officer.create({
      data: {
        name: body.get("name"),
        callsign: body.get("callsign"),
        userId: ctx.get("user").id,
        rankId: body.get("rank"),
        departmentId: body.get("department"),
      },
      include: {
        department: true,
      },
    });

    return officer;
  }

  @Put("/:id/status")
  async setOfficerStatus(
    @PathParams("id") officerId: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
    @Res() res: Res,
  ) {
    const error = validate(UPDATE_OFFICER_STATUS_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const officer = await prisma.officer.findFirst({
      where: {
        //   todo: allow dispatch to use this route
        userId: ctx.get("user").id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    if (officer.suspended) {
      throw new BadRequest("officerSuspended");
    }

    const code = await prisma.statusValue.findFirst({
      where: {
        value: {
          value: body.get("status2"),
        },
      },
    });

    if (!code) {
      throw new NotFound("statusNotFound");
    }

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        status: body.get("status"),
        status2Id: code.shouldDo === ShouldDoType.SET_OFF_DUTY ? null : code.id,
      },
      include: {
        status2: {
          include: { value: true },
        },
      },
    });

    // todo: add officer logs here

    if (code.shouldDo === ShouldDoType.SET_OFF_DUTY) {
      setCookie({
        res,
        name: Cookie.ActiveOfficer,
        value: "",
        expires: -1,
      });
    } else {
      // expires after 3 hours.
      setCookie({
        res,
        name: Cookie.ActiveOfficer,
        value: signJWT({ officerId: updatedOfficer.id }, 60 * 60 * 3),
        expires: 60 * 60 * 1000 * 3,
      });
    }

    // todo: send webhook
    // todo: update sockets

    return updatedOfficer;
  }

  @Delete("/:id")
  async deleteOfficer(@PathParams("id") officerId: string, @Context() ctx: Context) {
    const officer = await prisma.officer.findFirst({
      where: {
        userId: ctx.get("user").id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    await prisma.officer.delete({
      where: {
        id: officer.id,
      },
    });

    return true;
  }

  @Get("/active-officer")
  async getActiveOfficer(@Req() req: Req, @Context() ctx: Context) {
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
        userId: ctx.get("user").id,
        id: jwtPayload.officerId,
      },
    });

    if (!officer) {
      throw new BadRequest("noActiveOfficer");
    }

    return officer;
  }
}
