import { ExpungementRequestStatus, Feature, User, WhitelistStatus } from "@prisma/client";
import { BodyParams, Context, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Get, Post } from "@tsed/schema";
import { citizenIncludeWithRecords } from "controllers/citizen/CitizenController";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";

export const expungementRequestInclude = {
  citizen: true,
  warrants: true,
  records: { include: { violations: { include: { penalCode: true } } } },
};

@Controller("/expungement-requests")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.COURTHOUSE })
export class ExpungementRequestsController {
  @Get("/")
  async getRequestPerUser(
    @Context("user") user: User,
  ): Promise<APITypes.GetExpungementRequestsData> {
    const requests = await prisma.expungementRequest.findMany({
      where: {
        userId: user.id,
      },
      include: expungementRequestInclude,
    });

    return requests;
  }

  @Get("/:citizenId")
  async getCitizensRecords(
    @Context("user") user: User,
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.GetExpungementRequestByCitizenIdData> {
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, userId: user.id },
      include: { ...citizenIncludeWithRecords, warrants: true },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    return citizen;
  }

  @Delete("/:citizenId/:expungementRequestId")
  async cancelExpungementRequest(
    @Context("user") user: User,
    @PathParams("citizenId") citizenId: string,
    @PathParams("expungementRequestId") expungementRequestId: string,
  ): Promise<any> {
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, userId: user.id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    await prisma.expungementRequest.update({
      where: { id: expungementRequestId },
      data: { status: ExpungementRequestStatus.CANCELED },
    });

    return true;
  }

  @Post("/:citizenId")
  async requestExpungement(
    @Context("user") user: User,
    @PathParams("citizenId") citizenId: string,
    @BodyParams() body: any,
  ): Promise<APITypes.PostExpungementRequestByCitizenIdData> {
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, userId: user.id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const request = await prisma.expungementRequest.create({
      data: {
        citizenId: citizen.id,
        userId: user.id || undefined,
      },
      include: expungementRequestInclude,
    });

    const warrants = body.warrants as string[];
    const arrestReports = body.arrestReports as string[];
    const tickets = body.tickets as string[];

    if (arrestReports.length <= 0 && tickets.length <= 0 && warrants.length <= 0) {
      throw new BadRequest("mustSpecifyMinOneArray");
    }

    await Promise.all(
      [...arrestReports, ...tickets].map(async (id) => {
        const existing = await prisma.expungementRequest.findFirst({
          where: { records: { some: { id } }, status: WhitelistStatus.PENDING },
        });

        if (existing) {
          return error(new BadRequest("recordOrWarrantAlreadyLinked"), request.id);
        }

        return prisma.expungementRequest.update({
          where: { id: request.id },
          data: {
            records: { connect: { id } },
          },
        });
      }),
    );

    await Promise.all(
      warrants.map(async (id) => {
        const existing = await prisma.expungementRequest.findFirst({
          where: { warrants: { some: { id } }, status: WhitelistStatus.PENDING },
        });

        if (existing) {
          return error(new BadRequest("recordOrWarrantAlreadyLinked"), request.id);
        }

        return prisma.expungementRequest.update({
          where: { id: request.id },
          data: {
            warrants: { connect: { id } },
          },
        });
      }),
    );

    const updatedRequest = await prisma.expungementRequest.findUnique({
      where: { id: request.id },
      include: expungementRequestInclude,
    });

    return updatedRequest!;
  }
}

async function error<T extends Error = Error>(error: T, id: string) {
  await prisma.expungementRequest.delete({
    where: { id },
  });

  throw error;
}
