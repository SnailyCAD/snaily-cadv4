import {
  DLExam,
  DLExamPassType,
  DLExamStatus,
  DriversLicenseCategoryValue,
  Prisma,
} from "@prisma/client";
import { DL_EXAM_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Controller, BodyParams, PathParams, QueryParams } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { manyToManyHelper } from "utils/manyToMany";

const dlExamIncludes = {
  citizen: true,
  license: true,
  categories: { include: { value: true } },
};

@Controller("/leo/dl-exams")
@UseBeforeEach(IsAuth)
export class DLExamsController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ViewDLExams, Permissions.ManageDLExams],
  })
  async getAllDLExams(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
  ) {
    const where: Prisma.DLExamWhereInput | undefined = query
      ? {
          OR: [
            { license: { value: { contains: query, mode: "insensitive" } } },
            { citizen: { name: { contains: query, mode: "insensitive" } } },
            { citizen: { surname: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined;

    const [exams, totalCount] = await Promise.all([
      prisma.dLExam.findMany({
        include: dlExamIncludes,
        orderBy: { createdAt: "desc" },
        where,
        skip,
        take: 35,
      }),
      prisma.dLExam.count({ where }),
    ]);

    return { exams, totalCount };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageDLExams],
  })
  async createDLEXam(@BodyParams() body: unknown) {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const status = this.getExamStatus(data);
    const exam = await prisma.dLExam.create({
      data: {
        citizenId: data.citizenId,
        practiceExam: data.practiceExam as DLExamPassType | null,
        theoryExam: data.theoryExam as DLExamPassType | null,
        licenseId: data.license,
        status,
      },
      include: { categories: true },
    });

    const connectDisconnectArr = manyToManyHelper([], data.categories as string[]);
    await prisma.$transaction(
      connectDisconnectArr.map((item) =>
        prisma.dLExam.update({
          where: { id: exam.id },
          data: { categories: item },
        }),
      ),
    );

    if (status === DLExamStatus.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.dLExam.findUnique({
      where: { id: exam.id },
      include: dlExamIncludes,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageDLExams],
  })
  async updateDLEXam(@PathParams("id") examId: string, @BodyParams() body: unknown) {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const exam = await prisma.dLExam.findUnique({
      where: { id: examId },
      include: { categories: true },
    });

    if (!exam || exam.status !== DLExamStatus.IN_PROGRESS) {
      throw new NotFound("examNotFound");
    }

    const connectDisconnectArr = manyToManyHelper(
      exam.categories.map((v) => v.id),
      data.categories as string[],
    );

    await prisma.$transaction(
      connectDisconnectArr.map((item) =>
        prisma.dLExam.update({
          where: { id: exam.id },
          data: { categories: item },
        }),
      ),
    );

    const status = this.getExamStatus(data);
    if (status === DLExamStatus.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.dLExam.update({
      where: { id: examId },
      data: {
        practiceExam: data.practiceExam as DLExamPassType | null,
        theoryExam: data.theoryExam as DLExamPassType | null,
        status,
      },
      include: dlExamIncludes,
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageDLExams],
  })
  async deleteDLEXam(@PathParams("id") examId: string) {
    const exam = await prisma.dLExam.findUnique({
      where: { id: examId },
      include: { categories: true },
    });

    if (!exam) {
      throw new NotFound("examNotFound");
    }

    await prisma.dLExam.delete({
      where: { id: examId },
    });

    return true;
  }

  private getExamStatus(data: ExamData) {
    if (!data.theoryExam || !data.practiceExam) {
      return DLExamStatus.IN_PROGRESS;
    }

    const oneOfTypeFailed =
      data.theoryExam === DLExamPassType.FAILED || data.practiceExam === DLExamPassType.FAILED;

    if (oneOfTypeFailed) {
      return DLExamStatus.FAILED;
    }

    return DLExamStatus.PASSED;
  }

  private async grantLicenseToCitizen(
    exam: DLExam & { categories: DriversLicenseCategoryValue[] },
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
