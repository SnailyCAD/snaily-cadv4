import type { DLExamPassType, DLExamStatus } from "@prisma/client";
import { DL_EXAM_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Controller, BodyParams, PathParams } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { manyToManyHelper } from "utils/manyToMany";

const dlExamIncludes = {
  citizen: true,
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
  getAllDLExams() {
    const exams = prisma.dLExam.findMany({
      include: dlExamIncludes,
    });

    return exams;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageDLExams],
  })
  async createDLEXam(@BodyParams() body: unknown) {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const exam = await prisma.dLExam.create({
      data: {
        citizenId: data.citizenId,
        practiceExam: data.practiceExam as DLExamPassType | null,
        theoryExam: data.theoryExam as DLExamPassType | null,
        status: data.status as DLExamStatus,
      },
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

    if (!exam) {
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

    const updated = await prisma.dLExam.update({
      where: { id: examId },
      data: {
        citizenId: data.citizenId,
        practiceExam: data.practiceExam as DLExamPassType | null,
        theoryExam: data.theoryExam as DLExamPassType | null,
        status: data.status as DLExamStatus,
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
}
