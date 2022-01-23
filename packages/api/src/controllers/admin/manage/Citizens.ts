import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, Post } from "@tsed/schema";
import { userProperties } from "lib/auth";
import { leoProperties } from "lib/officer";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { IMPORT_CITIZENS_ARR } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { generateString } from "utils/generateString";
import { MultipartFile, PlatformMulterFile } from "@tsed/common";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/citizens")
export class ManageCitizensController {
  @Get("/")
  async getCitizens() {
    const citizens = await prisma.citizen.findMany({
      include: {
        user: {
          select: userProperties,
        },
        gender: true,
        ethnicity: true,
      },
    });

    return citizens;
  }

  @Get("/records-logs")
  async getRecordLogsForCitizen() {
    const citizens = await prisma.recordLog.findMany({
      include: {
        warrant: { include: { officer: { include: leoProperties } } },
        records: {
          include: {
            officer: { include: leoProperties },
            violations: { include: { penalCode: true } },
          },
        },
        citizen: {
          include: { user: { select: userProperties }, gender: true, ethnicity: true },
        },
      },
    });

    return citizens;
  }

  @Delete("/:id")
  async deleteCitizen(
    @Context() ctx: Context,
    @BodyParams() body: any,
    @PathParams("id") citizenId: string,
  ) {
    const reason = body.reason;

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    if (citizen.userId) {
      await prisma.notification.create({
        data: {
          userId: citizen.userId,
          executorId: ctx.get("user").id,
          description: reason,
          title: "CITIZEN_DELETED",
        },
      });
    }

    await prisma.citizen.delete({
      where: {
        id: citizenId,
      },
    });

    return true;
  }

  @Post("/import")
  async importCitizens(
    @BodyParams() body: unknown,
    @MultipartFile("file") file?: PlatformMulterFile,
  ) {
    const toValidateBody = file ? this.parseImportFile(file) : body;
    const data = validateSchema(IMPORT_CITIZENS_ARR, toValidateBody);

    return Promise.all(
      data.map(async (data) => {
        return prisma.citizen.create({
          data: {
            name: data.name,
            surname: data.surname,
            ethnicityId: data.ethnicity,
            genderId: data.gender,
            dateOfBirth: new Date(data.dateOfBirth),
            address: data.address ?? "",
            eyeColor: data.eyeColor ?? "",
            hairColor: data.hairColor ?? "",
            height: data.height ?? "",
            weight: data.weight ?? "",
            socialSecurityNumber: generateString(9, { numbersOnly: true }),
          },
          include: { gender: true, ethnicity: true },
        });
      }),
    );
  }

  protected parseImportFile(file: PlatformMulterFile) {
    if (file.mimetype !== "application/json") {
      throw new BadRequest("invalidImageType");
    }

    const rawBody = file.buffer.toString("utf8").trim();
    let body = null;

    try {
      body = JSON.parse(rawBody);
    } catch {
      body = null;
    }

    if (!body) {
      throw new BadRequest("couldNotParseBody");
    }

    return body;
  }
}
