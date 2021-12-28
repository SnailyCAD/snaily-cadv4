import { Controller, UseBeforeEach, BodyParams } from "@tsed/common";
import { Delete, Get, JsonRequestBody } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { unitProperties } from "lib/officer";
import { ReleaseType } from "@prisma/client";

const citizenInclude = {
  Record: {
    include: {
      release: {
        include: {
          releasedBy: true,
        },
      },
      officer: {
        include: unitProperties,
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
  async releaseCitizen(@PathParams("id") id: string, @BodyParams() body: JsonRequestBody) {
    const citizen = await prisma.citizen.findUnique({
      where: { id },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    if (!citizen.arrested) {
      throw new BadRequest("citizenNotArrested");
    }

    const type = body.get("type") as ReleaseType;
    const releasedBy = body.get("releasedBy");
    const recordId = body.get("recordId");

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
