import { User } from "@prisma/client";
import { BodyParams, Context, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { Get, Post } from "@tsed/schema";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";

export const expungementRequestInclude = {
  citizen: true,
  warrants: true,
  records: { include: { violations: { include: { penalCode: true } } } },
};

@Controller("/expungement-requests")
@UseBeforeEach(IsAuth)
export class CourtController {
  @Get("/")
  async getRequestPerUser(@Context("user") user: User) {
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
  ) {
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, userId: user.id },
      include: { ...citizenInclude, warrants: true },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    return citizen;
  }

  @Post("/:citizenId")
  async requestExpungement(
    @Context("user") user: User,
    @PathParams("citizenId") citizenId: string,
    @BodyParams() body: any,
  ) {
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

    const updatedRecords = await Promise.all(
      [...arrestReports, ...tickets].map(async (id) => {
        const existing = await prisma.expungementRequest.findFirst({
          where: { records: { some: { id } }, status: "PENDING" },
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

    const updatedWarrants = await Promise.all(
      warrants.map(async (id) => {
        const existing = await prisma.expungementRequest.findFirst({
          where: { warrants: { some: { id } }, status: "PENDING" },
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

    return { ...request, warrants: updatedWarrants, records: updatedRecords };
  }
}

async function error<T extends Error = Error>(error: T, id: string) {
  await prisma.expungementRequest.delete({
    where: { id },
  });

  throw error;
}
