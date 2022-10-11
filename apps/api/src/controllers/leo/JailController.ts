import { Context, Controller, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Description, Get } from "@tsed/schema";
import { QueryParams, BodyParams, PathParams } from "@tsed/platform-params";
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
import type * as APITypes from "@snailycad/types/api";

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
      violations: {
        include: {
          penalCode: { include: { warningApplicable: true, warningNotApplicable: true } },
        },
      },
    },
  },
};

@Controller("/leo/jail")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class JailController {
  @Get("/")
  @Description("Get all the citizens who are jailed")
  @UsePermissions({
    permissions: [Permissions.ViewJail, Permissions.ManageJail],
    fallback: (u) => u.isLeo,
  })
  async getImprisonedCitizens(
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetJailedCitizensData> {
    const where = {
      OR: [{ arrested: true }, { Record: { some: { release: { isNot: null } } } }],
    };

    const [totalCount, citizens] = await prisma.$transaction([
      prisma.citizen.count({ where }),
      prisma.citizen.findMany({
        where,
        include: citizenInclude,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        orderBy: { createdAt: "desc" },
      }),
    ]);

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

    return { totalCount, jailedCitizens: citizens };
  }

  @Delete("/:id")
  @Description("Release a citizen by its id and type (time out / released by)")
  @UsePermissions({
    permissions: [Permissions.ManageJail],
    fallback: (u) => u.isLeo,
  })
  async releaseCitizen(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.DeleteReleaseJailedCitizenData> {
    const data = validateSchema(RELEASE_CITIZEN_SCHEMA, body);

    return this.handleReleaseCitizen(id, data);
  }

  private async handleReleaseCitizen(
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
        citizenId: type === ReleaseType.BAIL_POSTED ? releasedById || null : null,
      },
    });

    const updatedCitizen = await prisma.citizen.update({
      where: { id: citizen.id },
      data: {
        arrested: true,
        Record: {
          update: {
            where: { id: record.id },
            data: { release: { connect: { id: release.id } } },
          },
        },
      },
      include: citizenInclude,
    });

    return updatedCitizen;
  }
}
