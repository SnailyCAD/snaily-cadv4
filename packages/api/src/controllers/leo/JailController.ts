import { Controller, UseBeforeEach, BodyParams } from "@tsed/common";
import { Delete, Get } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { leoProperties } from "lib/officer";
import { ReleaseType } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { RELEASE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

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
  async releaseCitizen(@PathParams("id") id: string, @BodyParams() body: unknown) {
    const data = validateSchema(RELEASE_CITIZEN_SCHEMA, body);
    const citizen = await prisma.citizen.findUnique({
      where: { id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    if (!citizen.arrested) {
      throw new ExtendedBadRequest({ releasedBy: "citizenNotArrested" });
    }

    const type = data.type as ReleaseType;
    const releasedBy = data.releasedBy;
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
        citizenId: type === ReleaseType.BAIL_POSTED ? releasedBy : null,
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
