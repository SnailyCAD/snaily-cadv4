import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { IsAuth } from "../../middlewares";
import {
  CREATE_COMPANY_SCHEMA,
  JOIN_COMPANY_SCHEMA,
  CREATE_COMPANY_POST_SCHEMA,
  validate,
} from "@snailycad/schemas";
import { BadRequest, Forbidden, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { MiscCadSettings } from ".prisma/client";

@UseBeforeEach(IsAuth)
@Controller("/businesses")
export class BusinessController {
  @Get("/:type/:citizenId")
  async getBusinesses(
    @Context() ctx: Context,
    @PathParams("type") type: "citizen" | "business",
    @PathParams("citizenId") id: string,
    @QueryParams("employeeId") employeeId: string,
  ) {
    if (type === "citizen") {
      const businesses = await prisma.business.findMany({
        where: {
          citizenId: id,
          userId: ctx.get("user").id,
        },
        include: {
          employees: {
            include: {
              role: true,
              citizen: {
                select: {
                  name: true,
                  surname: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      return businesses;
    }

    if (type === "business") {
      const business = await prisma.business.findUnique({
        where: {
          id,
        },
        include: {
          businessPosts: true,
          employees: {
            include: {
              role: true,
              citizen: {
                select: {
                  name: true,
                  surname: true,
                  id: true,
                },
              },
            },
          },
          citizen: {
            select: {
              name: true,
              surname: true,
              id: true,
            },
          },
        },
      });

      const employee = employeeId
        ? await prisma.employee.findFirst({
            where: {
              citizenId: employeeId,
            },
          })
        : null;

      if (!employee || employee.userId !== ctx.get("user").id) {
        throw new NotFound("employeeNotFound");
      }

      return { ...business, employee };
    }

    throw new NotFound("invalid type");
  }

  @Post("/join")
  async joinCompany(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(JOIN_COMPANY_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("ownerId"),
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const { miscCadSettings } = ctx.get("cad") as { miscCadSettings: MiscCadSettings | null };
    if (miscCadSettings && miscCadSettings.maxBusinessesPerCitizen !== null) {
      const length = await prisma.business.count({
        where: {
          citizenId: citizen.id,
        },
      });

      if (length > miscCadSettings.maxBusinessesPerCitizen) {
        throw new BadRequest("TODO");
      }
    }

    const business = await prisma.business.findUnique({
      where: {
        id: body.get("businessId"),
      },
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    const inBusiness = await prisma.employee.findFirst({
      where: {
        businessId: body.get("businessId"),
        citizenId: body.get("citizenId"),
      },
    });

    if (inBusiness) {
      throw new BadRequest("alreadyInThisBusiness");
    }

    const employee = await prisma.employee.create({
      data: {
        businessId: business.id,
        citizenId: citizen.id,
        employeeOfTheMonth: false,
        userId: ctx.get("user").id,
      },
    });

    await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        employees: {
          connect: {
            id: employee.id,
          },
        },
      },
    });

    return business;
  }

  @Post("/create")
  async createCompany(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_COMPANY_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const owner = await prisma.citizen.findUnique({
      where: {
        id: body.get("ownerId"),
      },
    });

    if (!owner || owner.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const { miscCadSettings } = ctx.get("cad") as { miscCadSettings: MiscCadSettings | null };

    if (miscCadSettings && miscCadSettings.maxBusinessesPerCitizen !== null) {
      const length = await prisma.business.count({
        where: {
          citizenId: owner.id,
        },
      });

      if (length > miscCadSettings.maxBusinessesPerCitizen) {
        throw new BadRequest("TODO");
      }
    }

    const business = await prisma.business.create({
      data: {
        citizenId: owner.id,
        name: body.get("name"),
        address: body.get("address"),
        whitelisted: body.get("whitelisted") ?? false,
        userId: ctx.get("user").id,
      },
    });

    const ownerRole = await prisma.value.create({
      data: {
        type: "BUSINESS_ROLE",
        value: "Owner",
        isDefault: false,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        businessId: business.id,
        citizenId: owner.id,
        employeeOfTheMonth: false,
        userId: ctx.get("user").id,
        roleId: ownerRole.id,
        canCreatePosts: true,
      },
    });

    await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        employees: {
          connect: {
            id: employee.id,
          },
        },
      },
    });

    return business;
  }

  @Post("/:id/posts")
  async createPost(
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
    @PathParams("id") id: string,
  ) {
    const error = validate(CREATE_COMPANY_POST_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: body.get("employeeId"),
      },
    });

    if (!employee || employee.userId !== ctx.get("user").id || employee.businessId !== id) {
      throw new NotFound("notFound");
    }

    if (!employee.canCreatePosts) {
      throw new Forbidden("insufficientPermissions");
    }

    const post = await prisma.businessPost.create({
      data: {
        body: body.get("body"),
        title: body.get("title"),
        businessId: id,
        employeeId: employee.id,
        userId: ctx.get("user").id,
      },
    });

    return post;
  }
}
