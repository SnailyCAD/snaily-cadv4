import {
  Prisma,
  LicenseExam,
  DriversLicenseCategoryValue,
  LicenseExamType,
  Feature,
} from "@prisma/client";
import { LicenseExamPassType, LicenseExamStatus } from "@snailycad/types";
import { LICENSE_EXAM_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Controller, BodyParams, PathParams, QueryParams } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { manyToManyHelper } from "lib/data/many-to-many";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";

const licenseExamIncludes = {
  citizen: true,
  license: true,
  categories: { include: { value: true } },
};

@Controller("/leo/license-exams")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.LICENSE_EXAMS })
export class LicenseExamsController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ViewLicenseExams, Permissions.ManageLicenseExams],
  })
  async getAlllicenseExams(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetLicenseExamsData> {
    const where: Prisma.LicenseExamWhereInput | undefined = query
      ? {
          OR: [
            { license: { value: { contains: query, mode: "insensitive" } } },
            { citizen: { name: { contains: query, mode: "insensitive" } } },
            { citizen: { surname: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined;

    const [exams, totalCount] = await prisma.$transaction([
      prisma.licenseExam.findMany({
        include: licenseExamIncludes,
        orderBy: { createdAt: "desc" },
        where,
        skip,
        take: 35,
      }),
      prisma.licenseExam.count({ where }),
    ]);

    return { exams, totalCount };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageLicenseExams],
  })
  async createlicenseExam(@BodyParams() body: unknown): Promise<APITypes.PostLicenseExamsData> {
    const data = validateSchema(LICENSE_EXAM_SCHEMA, body);

    const status = this.getExamStatus(data);
    const exam = await prisma.licenseExam.create({
      data: {
        type: data.type as LicenseExamType,
        citizenId: data.citizenId,
        practiceExam: data.practiceExam as LicenseExamPassType | null,
        theoryExam: data.theoryExam as LicenseExamPassType | null,
        licenseId: data.license,
        status,
      },
      include: { categories: true },
    });

    const connectDisconnectArr = manyToManyHelper([], data.categories as string[]);
    await prisma.$transaction(
      connectDisconnectArr.map((item) =>
        prisma.licenseExam.update({
          where: { id: exam.id },
          data: { categories: item },
        }),
      ),
    );

    if (status === LicenseExamStatus.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.licenseExam.findUniqueOrThrow({
      where: { id: exam.id },
      include: licenseExamIncludes,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageLicenseExams],
  })
  async updatelicenseExam(
    @PathParams("id") examId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutLicenseExamByIdData> {
    const data = validateSchema(LICENSE_EXAM_SCHEMA, body);

    const exam = await prisma.licenseExam.findUnique({
      where: { id: examId },
      include: { categories: true },
    });

    if (!exam || exam.status !== LicenseExamStatus.IN_PROGRESS) {
      throw new NotFound("examNotFound");
    }

    const connectDisconnectArr = manyToManyHelper(
      exam.categories.map((v) => v.id),
      data.categories as string[],
    );

    await prisma.$transaction(
      connectDisconnectArr.map((item) =>
        prisma.licenseExam.update({
          where: { id: exam.id },
          data: { categories: item },
        }),
      ),
    );

    const status = this.getExamStatus(data);
    if (status === LicenseExamPassType.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.licenseExam.update({
      where: { id: examId },
      data: {
        practiceExam: data.practiceExam as LicenseExamPassType | null,
        theoryExam: data.theoryExam as LicenseExamPassType | null,
        status,
      },
      include: licenseExamIncludes,
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageLicenseExams],
  })
  async deletelicenseExam(
    @PathParams("id") examId: string,
  ): Promise<APITypes.DeleteLicenseExamByIdData> {
    const exam = await prisma.licenseExam.findUnique({
      where: { id: examId },
      include: { categories: true },
    });

    if (!exam) {
      throw new NotFound("examNotFound");
    }

    await prisma.licenseExam.delete({
      where: { id: examId },
    });

    return true;
  }

  private getExamStatus(data: ExamData) {
    if (!data.theoryExam || !data.practiceExam) {
      return LicenseExamStatus.IN_PROGRESS;
    }

    const oneOfTypeFailed =
      data.theoryExam === LicenseExamPassType.FAILED ||
      data.practiceExam === LicenseExamPassType.FAILED;

    if (oneOfTypeFailed) {
      return LicenseExamPassType.FAILED;
    }

    return LicenseExamPassType.PASSED;
  }

  private async grantLicenseToCitizen(
    exam: Omit<LicenseExam, "citizen" | "license"> & { categories: DriversLicenseCategoryValue[] },
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: exam.citizenId },
      include: { dlCategory: true },
    });

    if (!citizen) return;

    const connectDisconnectArr = manyToManyHelper(citizen.dlCategory, exam.categories, {
      accessor: "id",
    });

    const prismaNames = {
      DRIVER: "driversLicenseId",
      FIREARM: "weaponLicenseId",
      WATER: "waterLicenseId",
      PILOT: "pilotLicenseId",
    } as const;
    const prismaName = prismaNames[exam.type];

    await prisma.$transaction([
      prisma.citizen.update({
        where: { id: citizen.id },
        data: { [prismaName]: exam.licenseId },
      }),
      ...connectDisconnectArr.map((item) =>
        prisma.citizen.update({
          where: { id: citizen.id },
          data: { dlCategory: item },
        }),
      ),
    ]);
  }
}

interface ExamData {
  theoryExam: string | null;
  practiceExam: string | null;
}
