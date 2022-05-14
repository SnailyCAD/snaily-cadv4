import { Context, Controller, UseBeforeEach, BodyParams } from "@tsed/common";
import { Delete, Description, Get } from "@tsed/schema";
import { PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { MiscCadSettings, ReleaseType } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { RELEASE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { convertToJailTimeScale } from "lib/leo/utils";

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
  async getImprisonedCitizens(@Context("cad") cad: { miscCadSettings: MiscCadSettings }) {
    const citizens = await prisma.citizen.findMany({
      where: {
        OR: [
          {
            arrested: true,
          },
          { Record: { some: { release: { isNot: null } } } },
        ],
      },
      include: citizenInclude,
    });

    const jailTimeScale = cad.miscCadSettings.jailTimeScale;
    if (jailTimeScale) {
      const citizenIdsToUpdate = {} as Record<string, string[]>;

      citizens.map((citizen) => {
        citizen.Record.map((record) => {
          if (record.type === "ARREST_REPORT") {
            const totalJailTime = record.violations.reduce((ac, cv) => ac + (cv.jailTime || 0), 0);
            const time = convertToJailTimeScale(totalJailTime, jailTimeScale);
            const expireDate = new Date(record.createdAt).getTime() + time;
            const shouldExpire = Date.now() >= expireDate;

            if (shouldExpire) {
              citizenIdsToUpdate[citizen.id] = [
                ...(citizenIdsToUpdate[citizen.id] ?? []),
                record.id,
              ];
            }
          }
        });
      });

      Promise.all(
        Object.entries(citizenIdsToUpdate).map(async ([citizenId, recordIds]) => {
          await Promise.all(
            recordIds.map(async (recordId) => {
              await this.handleReleaseCitizen(citizenId, {
                recordId,
                releasedById: "",
                type: ReleaseType.TIME_OUT,
              });
            }),
          );
        }),
      ).catch(console.error);
    }

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

    await this.handleReleaseCitizen(id, data);

    return true;
  }

  protected async handleReleaseCitizen(
    citizenId: string,
    data: Zod.infer<typeof RELEASE_CITIZEN_SCHEMA>,
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
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
  }
}
