import type { User } from "@snailycad/types";
import { Get, Post } from "@tsed/schema";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { NAME_CHANGE_REQUEST_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

@Controller("/name-change")
@UseBeforeEach(IsAuth)
export class NameChangeRequestController {
  @Get("/")
  async getUserRequests(@Context("user") user: User) {
    const requests = await prisma.nameChangeRequest.findMany({
      where: { userId: user.id },
    });

    return requests;
  }

  @Post("/")
  async requestNameChange(@BodyParams() body: unknown, @Context("user") user: User) {
    const data = validateSchema(NAME_CHANGE_REQUEST_SCHEMA, body);

    const citizen = await prisma.citizen.findFirst({
      where: { id: data.citizenId, userId: user.id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const existing = await prisma.nameChangeRequest.findFirst({
      where: {
        citizenId: data.citizenId,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existing) {
      throw new ExtendedBadRequest({ citizenId: "alreadyPendingNameChange" });
    }

    const request = await prisma.nameChangeRequest.create({
      data: {
        newName: data.newName,
        newSurname: data.newSurname,
        citizenId: data.citizenId,
        userId: user.id,
      },
    });

    return request;
  }
}
