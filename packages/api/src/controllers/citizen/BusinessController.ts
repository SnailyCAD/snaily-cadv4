import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { IsAuth } from "../../middlewares";
import { CREATE_COMPANY_SCHEMA, validate } from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";

@UseBeforeEach(IsAuth)
@Controller("/businesses")
export class BusinessController {
  @Get("/:citizenId")
  async getCitizensBusinesses(@Context() ctx: Context, @PathParams("citizenId") citizenId: string) {
    const businesses = await prisma.business.findMany({
      where: {
        citizenId,
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

    // const cad = ctx.get("cad") as cad;

    // if (cad.miscSettings.maxBusinessesPerCitizen !== null) {
    //   const length = await prisma.business.count({
    //     where: {
    //       citizenId: owner.id,
    //     },
    //   });

    //   if (length > cad.miscSettings.maxBusinessesPerCitizen) {
    //       throw new BadRequest("TODO")
    //   }
    // }

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
