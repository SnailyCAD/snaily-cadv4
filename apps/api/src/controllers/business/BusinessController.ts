import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Get, Hidden, Post, Put } from "@tsed/schema";
import { IsAuth } from "middlewares/is-auth";
import {
  CREATE_COMPANY_SCHEMA,
  JOIN_COMPANY_SCHEMA,
  DELETE_COMPANY_POST_SCHEMA,
} from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { type User, EmployeeAsEnum, MiscCadSettings, WhitelistStatus, cad } from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";

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
@Hidden()
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessController {
  @Get("/")
  async getBusinessesByUser(@Context("user") user: User): Promise<APITypes.GetBusinessesData> {
    const businesses = await prisma.employee.findMany({
      where: {
        userId: user.id,
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
  async getBusinessById(
    @Context("user") user: User,
    @PathParams("id") id: string,
    @QueryParams("employeeId") employeeId: string,
  ): Promise<APITypes.GetBusinessByIdData> {
    const business = await prisma.business.findUnique({
      where: {
        id,
      },
      include: {
        roles: { include: { value: true } },
        businessPosts: { orderBy: { createdAt: "desc" } },
        vehicles: {
          include: {
            model: { include: { value: true } },
            registrationStatus: true,
            citizen: true,
          },
        },
        employees: {
          include: {
            role: { include: { value: true } },
            citizen: { select: { name: true, surname: true, id: true } },
          },
        },
        citizen: { select: { name: true, surname: true, id: true } },
      },
    });

    const employee = employeeId
      ? await prisma.employee.findFirst({
          where: {
            id: employeeId,
            NOT: { whitelistStatus: WhitelistStatus.DECLINED },
          },
          include: {
            role: { include: { value: true } },
            citizen: { select: { name: true, surname: true, id: true } },
          },
        })
      : null;

    if (!business || !employee || employee.userId !== user.id) {
      throw new NotFound("employeeNotFound");
    }

    return { ...business, employee };
  }

  @Put("/:id")
  async updateBusiness(
    @PathParams("id") businessId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PutBusinessByIdData> {
    const data = validateSchema(CREATE_COMPANY_SCHEMA, body);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId!,
        userId: user.id,
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
        postal: data.postal ? String(data.postal) : null,
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteBusiness(
    @PathParams("id") businessId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.DeleteBusinessByIdData> {
    const data = validateSchema(DELETE_COMPANY_POST_SCHEMA, body);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        userId: user.id,
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
  async joinBusiness(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings | null },
  ): Promise<APITypes.PostJoinBusinessData> {
    const data = validateSchema(JOIN_COMPANY_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    if (cad.miscCadSettings?.maxBusinessesPerCitizen) {
      const length = await prisma.business.count({
        where: {
          citizenId: citizen.id,
        },
      });

      if (length > cad.miscCadSettings.maxBusinessesPerCitizen) {
        throw new BadRequest("maxBusinessesLength");
      }
    }

    const business = await prisma.business.findUnique({
      where: {
        id: data.businessId,
      },
    });

    if (!business || business.status === WhitelistStatus.DECLINED) {
      throw new NotFound("notFound");
    }

    if (business.status === WhitelistStatus.PENDING) {
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
        userId: user.id,
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
  @UsePermissions({
    fallback: true,
    permissions: [Permissions.CreateBusinesses],
  })
  async createBusiness(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings | null },
  ): Promise<APITypes.PostCreateBusinessData> {
    const data = validateSchema(CREATE_COMPANY_SCHEMA, body);

    const owner = await prisma.citizen.findUnique({
      where: {
        id: data.ownerId,
      },
    });

    if (!owner || owner.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const { miscCadSettings, businessWhitelisted } = cad;
    if (miscCadSettings?.maxBusinessesPerCitizen) {
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
        address: data.address,
        name: data.name,
        whitelisted: data.whitelisted,
        postal: data.postal ? String(data.postal) : null,
        userId: user.id,
        status: businessWhitelisted ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
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
        userId: user.id,
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
        employees: { connect: { id: employee.id } },
      },
    });

    return { business: updated, id: business.id, employee };
  }
}
