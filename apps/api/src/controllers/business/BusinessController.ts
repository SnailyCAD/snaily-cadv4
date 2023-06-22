import {
  CREATE_COMPANY_SCHEMA,
  JOIN_COMPANY_SCHEMA,
  DELETE_COMPANY_POST_SCHEMA,
} from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { type User, EmployeeAsEnum, MiscCadSettings, WhitelistStatus, cad } from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";

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

@UseGuards(AuthGuard)
@Controller("/businesses")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessController {
  @Get("/")
  async getBusinessesByUser(@SessionUser() user: User): Promise<APITypes.GetBusinessesData> {
    const [ownedBusinesses, joinedBusinesses, joinableBusinesses] = await prisma.$transaction([
      prisma.employee.findMany({
        where: {
          userId: user.id,
          role: { as: EmployeeAsEnum.OWNER },
          business: { NOT: { status: WhitelistStatus.DECLINED } },
        },
        include: {
          citizen: { select: { id: true, name: true, surname: true } },
          business: true,
          role: { include: { value: true } },
        },
      }),
      prisma.employee.findMany({
        where: {
          userId: user.id,
          business: { NOT: { status: WhitelistStatus.DECLINED } },
          NOT: { role: { as: EmployeeAsEnum.OWNER } },
        },
        include: {
          citizen: { select: { id: true, name: true, surname: true } },
          business: true,
          role: { include: { value: true } },
        },
      }),
      prisma.business.findMany(),
    ]);

    return { ownedBusinesses, joinedBusinesses, joinableBusinesses };
  }

  @Get("/business/:id")
  async getBusinessById(
    @SessionUser() user: User,
    @Param("id") id: string,
    @Query("employeeId") employeeId: string,
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
      throw new NotFoundException("employeeNotFound");
    }

    return { ...business, employee };
  }

  @Put("/:id")
  async updateBusiness(
    @Param("id") businessId: string,
    @Body() body: unknown,
    @SessionUser() user: User,
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
      throw new NotFoundException("employeeNotFound");
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
    @Param("id") businessId: string,
    @Body() body: unknown,
    @SessionUser() user: User,
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
      throw new NotFoundException("employeeNotFound");
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
    @Body() body: unknown,
    @SessionUser() user: User,
    @Cad() cad: cad & { miscCadSettings: MiscCadSettings | null },
  ): Promise<APITypes.PostJoinBusinessData> {
    const data = validateSchema(JOIN_COMPANY_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFoundException("notFound");
    }

    if (cad.miscCadSettings?.maxBusinessesPerCitizen) {
      const ownedBusinessesCount = await prisma.employee.count({
        where: {
          citizenId: citizen.id,
          role: { as: "OWNER" },
        },
      });

      if (ownedBusinessesCount > cad.miscCadSettings.maxBusinessesPerCitizen) {
        throw new BadRequestException("maxBusinessesLength");
      }
    }

    const business = await prisma.business.findUnique({
      where: {
        id: data.businessId,
      },
    });

    if (!business || business.status === WhitelistStatus.DECLINED) {
      throw new NotFoundException("notFound");
    }

    if (business.status === WhitelistStatus.PENDING) {
      throw new BadRequestException("businessIsPending");
    }

    const inBusiness = await prisma.employee.findFirst({
      where: {
        businessId: data.businessId,
        citizenId: data.citizenId,
      },
    });

    if (inBusiness) {
      throw new BadRequestException("alreadyInThisBusiness");
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
    permissions: [Permissions.CreateBusinesses],
  })
  async createBusiness(
    @Body() body: unknown,
    @SessionUser() user: User,
    @Cad() cad: cad & { miscCadSettings: MiscCadSettings | null },
  ): Promise<APITypes.PostCreateBusinessData> {
    const data = validateSchema(CREATE_COMPANY_SCHEMA, body);

    const owner = await prisma.citizen.findUnique({
      where: {
        id: data.ownerId,
      },
    });

    if (!owner || owner.userId !== user.id) {
      throw new NotFoundException("notFound");
    }

    const { miscCadSettings, businessWhitelisted } = cad;
    if (miscCadSettings?.maxBusinessesPerCitizen) {
      const ownedBusinessesCount = await prisma.employee.count({
        where: {
          citizenId: owner.id,
          role: { as: "OWNER" },
        },
      });

      if (ownedBusinessesCount > miscCadSettings.maxBusinessesPerCitizen) {
        throw new BadRequestException("maxBusinessesLength");
      }
    }

    const business = await prisma.business.create({
      data: {
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
      where: { id: business.id },
      data: { employees: { connect: { id: employee.id } } },
    });

    return { business: updated, id: business.id, employee };
  }
}
