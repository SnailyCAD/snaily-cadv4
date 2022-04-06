import { Controller, UseBeforeEach, BodyParams } from "@tsed/common";
import { Delete, Description, Get } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { ReleaseType } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { RELEASE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";

const citizenInclude = {
  Record: {
    include: {
      release: {
        include: {
          releasedBy: true,
        },
      },
      officer: {
        include: leoProperties,
      },
      violations: true,
    },
  },
};

@Controller("/leo/jail")
@UseBeforeEach(IsAuth)
export class LeoController {
  @Get("/")
  @Description("Get all the citizens who are jailed")
  @UsePermissions({
    permissions: [Permissions.ViewJail, Permissions.ManageJail],
    fallback: (u) => u.isLeo,
  })
  async getImprisonedCitizens() {
    const citizens = await prisma.citizen.findMany({
      where: {
        OR: [
          {
            arrested: true,
          },
          {
            Record: {
              some: {
                release: {
                  isNot: null,
                },
              },
            },
          },
        ],
      },
      include: citizenInclude,
    });

    return citizens;
  }

  @Delete("/:id")
  @Description("Release a citizen by its id and type (time out / released by)")
  @UsePermissions({
    permissions: [Permissions.ManageJail],
    fallback: (u) => u.isLeo,
  })
  async releaseCitizen(@PathParams("id") id: string, @BodyParams() body: unknown) {
    const data = validateSchema(RELEASE_CITIZEN_SCHEMA, body);
    const citizen = await prisma.citizen.findUnique({
      where: { id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    if (!citizen.arrested) {
      throw new ExtendedBadRequest({ releasedById: "citizenNotArrested" });
    }

    const type = data.type as ReleaseType;
    const releasedById = data.releasedById;
    const recordId = data.recordId;

    const record = await prisma.record.findFirst({
      where: {
        id: recordId,
        citizenId: citizen.id,
      },
    });

    if (!record) {
      throw new NotFound("citizenNotFound");
    }

    const release = await prisma.recordRelease.create({
      data: {
        type,
        citizenId: type === ReleaseType.BAIL_POSTED ? releasedById : null,
      },
    });

    await prisma.record.update({
      where: { id: recordId },
      data: {
        citizen: { update: { arrested: false } },
        release: { connect: { id: release.id } },
      },
    });

    return true;
  }
}
