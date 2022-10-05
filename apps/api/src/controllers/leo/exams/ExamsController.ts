import type { Prisma } from "@prisma/client";
import { LicenseExam } from "@snailycad/types";
import { DL_EXAM_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Controller, BodyParams, PathParams, QueryParams } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { manyToManyHelper } from "utils/manyToMany";
import type * as APITypes from "@snailycad/types/api";

const licenseExamIncludes = {
  citizen: true,
  license: true,
  categories: { include: { value: true } },
};

@Controller("/leo/exams")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class LicenseExamsController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ViewlicenseExams, Permissions.ManagelicenseExams],
  })
  async getAlllicenseExams(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetlicenseExamsData> {
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
    permissions: [Permissions.ManagelicenseExams],
  })
  async createlicenseExam(@BodyParams() body: unknown): Promise<APITypes.PostlicenseExamsData> {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const status = this.getExamStatus(data);
    const exam = await prisma.licenseExam.create({
      data: {
        citizenId: data.citizenId,
        practiceExam: data.practiceExam as licenseExamPassType | null,
        theoryExam: data.theoryExam as licenseExamPassType | null,
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

    if (status === licenseExamStatus.PASSED) {
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
    permissions: [Permissions.ManagelicenseExams],
  })
  async updatelicenseExam(
    @PathParams("id") examId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutlicenseExamByIdData> {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const exam = await prisma.licenseExam.findUnique({
      where: { id: examId },
      include: { categories: true },
    });

    if (!exam || exam.status !== licenseExamStatus.IN_PROGRESS) {
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
    if (status === licenseExamStatus.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.licenseExam.update({
      where: { id: examId },
      data: {
        practiceExam: data.practiceExam as licenseExamPassType | null,
        theoryExam: data.theoryExam as licenseExamPassType | null,
        status,
      },
      include: licenseExamIncludes,
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManagelicenseExams],
  })
  async deletelicenseExam(
    @PathParams("id") examId: string,
  ): Promise<APITypes.DeletelicenseExamByIdData> {
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
      return licenseExamStatus.IN_PROGRESS;
    }

    const oneOfTypeFailed =
      data.theoryExam === licenseExamPassType.FAILED ||
      data.practiceExam === licenseExamPassType.FAILED;

    if (oneOfTypeFailed) {
      return licenseExamStatus.FAILED;
    }

    return licenseExamStatus.PASSED;
  }

  private async grantLicenseToCitizen(
    exam: licenseExam & { categories: DriversLicenseCategoryValue[] },
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: { id: exam.citizenId },
      include: { dlCategory: true },
    });

    if (!citizen) return;

    const connectDisconnectArr = manyToManyHelper(citizen.dlCategory, exam.categories, {
      accessor: "id",
    });

    await prisma.$transaction([
      prisma.citizen.update({
        where: { id: citizen.id },
        data: { driversLicenseId: exam.licenseId },
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
