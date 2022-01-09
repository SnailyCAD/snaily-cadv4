import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { IsAuth } from "middlewares/index";
import {
  CREATE_COMPANY_SCHEMA,
  JOIN_COMPANY_SCHEMA,
  DELETE_COMPANY_POST_SCHEMA,
} from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { EmployeeAsEnum, MiscCadSettings, WhitelistStatus } from ".prisma/client";
import { validateSchema } from "lib/validateSchema";

const businessInclude = {
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
};

@UseBeforeEach(IsAuth)
@Controller("/businesses")
export class BusinessController {
  @Get("/")
  async getBusinessesByUser(@Context() ctx: Context) {
    const businesses = await prisma.employee.findMany({
      where: {
        userId: ctx.get("user").id,
        business: { NOT: { status: WhitelistStatus.DECLINED } },
        NOT: { whitelistStatus: WhitelistStatus.DECLINED },
      },
      include: {
        citizen: { select: { id: true, name: true, surname: true } },
        business: true,
        role: { include: { value: true } },
      },
    });

    const joinableBusinesses = await prisma.business.findMany({});

    return { businesses, joinableBusinesses };
  }

  @Get("/business/:id")
  async getBusinesses(
    @Context() ctx: Context,
    @PathParams("id") id: string,
    @QueryParams("employeeId") employeeId: string,
  ) {
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
            NOT: {
              whitelistStatus: WhitelistStatus.DECLINED,
            },
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

  @Put("/:id")
  async updateBusiness(
    @PathParams("id") businessId: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
  ) {
    const data = validateSchema(CREATE_COMPANY_SCHEMA, body.toJSON());

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
        address: data.address,
        name: data.name,
        whitelisted: data.whitelisted,
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
    const data = validateSchema(DELETE_COMPANY_POST_SCHEMA, body.toJSON());

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
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
    const data = validateSchema(JOIN_COMPANY_SCHEMA, body.toJSON());

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
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
        throw new BadRequest("maxBusinessesLength");
      }
    }

    const business = await prisma.business.findUnique({
      where: {
        id: data.businessId,
      },
    });

    if (!business || business.status === "DECLINED") {
      throw new NotFound("notFound");
    }

    if (business.status === "PENDING") {
      throw new BadRequest("businessIsPending");
    }

    const inBusiness = await prisma.employee.findFirst({
      where: {
        businessId: data.businessId,
        citizenId: data.citizenId,
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
        whitelistStatus: business.whitelisted ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
      },
      include: businessInclude,
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

    return employee;
  }

  @Post("/create")
  async createBusiness(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const data = validateSchema(CREATE_COMPANY_SCHEMA, body.toJSON());

    const owner = await prisma.citizen.findUnique({
      where: {
        id: data.ownerId,
      },
    });

    if (!owner || owner.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const { miscCadSettings, businessWhitelisted } = ctx.get("cad") as {
      businessWhitelisted: boolean;
      miscCadSettings: MiscCadSettings | null;
    };

    if (miscCadSettings && miscCadSettings.maxBusinessesPerCitizen !== null) {
      const length = await prisma.business.count({
        where: {
          citizenId: owner.id,
        },
      });

      if (length > miscCadSettings.maxBusinessesPerCitizen) {
        throw new BadRequest("maxBusinessesLength");
      }
    }

    const business = await prisma.business.create({
      data: {
        citizenId: owner.id,
        name: data.name,
        address: data.address,
        whitelisted: data.whitelisted ?? false,
        userId: ctx.get("user").id,
        status: businessWhitelisted ? "PENDING" : "ACCEPTED",
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
      include: businessInclude,
    });

    const updated = await prisma.business.update({
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

    return { business: updated, id: business.id, employee };
  }
}
