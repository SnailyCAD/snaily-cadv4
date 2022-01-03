import { User } from "@prisma/client";
import { BodyParams, Context, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";

@Controller("/expungement-requests")
@UseBeforeEach(IsAuth)
export class CourtController {
  @Get("/")
  async getRequestPerUser(@Context("user") user: User) {
    const requests = await prisma.expungementRequest.findMany({
      where: {
        userId: user.id,
      },
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
    @BodyParams() body: JsonRequestBody,
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
        userId: user.id,
      },
    });

    const warrants = body.get("warrants") as string[];
    const arrestReports = body.get("arrestReports") as string[];
    const tickets = body.get("tickets") as string[];

    if (arrestReports.length <= 0 && tickets.length <= 0 && warrants.length <= 0) {
      throw new BadRequest("mustSpecifyMinOneArray");
    }

    const updatedRecords = await Promise.all(
      [...arrestReports, ...tickets].map(async (id) => {
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
