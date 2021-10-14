import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { IsAuth } from "../../middlewares";
import {
  CREATE_COMPANY_SCHEMA,
  JOIN_COMPANY_SCHEMA,
  DELETE_COMPANY_POST_SCHEMA,
  validate,
} from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { EmployeeAsEnum, MiscCadSettings } from ".prisma/client";

@UseBeforeEach(IsAuth)
@Controller("/")
export class BusinessController {
  @Get("/")
  async getBusinessesByUser(@Context() ctx: Context) {
    const businesses = await prisma.employee.findMany({
      where: {
        userId: ctx.get("user").id,
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        business: true,
        role: {
          include: {
            value: true,
          },
        },
      },
    });

    const joinableBusinesses = await prisma.business.findMany({});

    return { businesses, joinableBusinesses };
  }

  @Get("/:type/:employeeId")
  async getBusinesses(
    @Context() ctx: Context,
    @PathParams("type") type: "citizen" | "business",
    @PathParams("employeeId") id: string,
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
              role: {
                include: {
                  value: true,
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
          businessPosts: {
            orderBy: {
              createdAt: "desc",
            },
          },
          employees: {
            include: {
              role: {
                include: {
                  value: true,
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
              id: employeeId,
            },
            include: {
              role: {
                include: {
                  value: true,
                },
              },
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

  @Put("/:id")
  async updateBusiness(
    @PathParams("id") businessId: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
  ) {
    const error = validate(CREATE_COMPANY_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: body.get("employeeId"),
        userId: ctx.get("user").id,
        businessId,
        role: {
          as: "OWNER",
        },
      },
    });

    if (!employee) {
      throw new NotFound("employeeNotFound");
    }

    const updated = await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        address: body.get("address"),
        name: body.get("name"),
        whitelisted: body.get("whitelisted"),
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteBusiness(
    @PathParams("id") businessId: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
  ) {
    const error = validate(DELETE_COMPANY_POST_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: body.get("employeeId"),
        userId: ctx.get("user").id,
        businessId,
        role: {
          as: "OWNER",
        },
      },
    });

    if (!employee) {
      throw new NotFound("employeeNotFound");
    }

    await prisma.business.delete({
      where: {
        id: businessId,
      },
    });

    return true;
  }

  @Post("/join")
  async joinBusiness(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(JOIN_COMPANY_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
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

    let employeeRole = await prisma.employeeValue.findFirst({
      where: {
        as: EmployeeAsEnum.EMPLOYEE,
      },
      include: {
        value: true,
      },
    });

    if (!employeeRole) {
      const value = await prisma.value.create({
        data: {
          type: "BUSINESS_ROLE",
          value: "Employee",
          isDefault: false,
        },
      });

      employeeRole = await prisma.employeeValue.create({
        data: {
          as: EmployeeAsEnum.EMPLOYEE,
          valueId: value.id,
        },
        include: {
          value: true,
        },
      });
    }

    const employee = await prisma.employee.create({
      data: {
        businessId: business.id,
        citizenId: citizen.id,
        employeeOfTheMonth: false,
        userId: ctx.get("user").id,
        roleId: employeeRole.id,
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
      include: {
        employees: {
          include: {
            role: {
              include: {
                value: true,
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

    return business;
  }

  @Post("/create")
  async createBusiness(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
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

    let ownerRole = await prisma.employeeValue.findFirst({
      where: {
        as: EmployeeAsEnum.OWNER,
      },
      include: {
        value: true,
      },
    });

    if (!ownerRole) {
      const value = await prisma.value.create({
        data: {
          type: "BUSINESS_ROLE",
          value: "Owner",
          isDefault: false,
        },
      });

      ownerRole = await prisma.employeeValue.create({
        data: {
          as: EmployeeAsEnum.OWNER,
          valueId: value.id,
        },
        include: {
          value: true,
        },
      });
    }

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
}
