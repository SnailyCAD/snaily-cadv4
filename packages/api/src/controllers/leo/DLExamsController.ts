import { DLExamPassType, DLExamStatus } from "@prisma/client";
import { DL_EXAM_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Controller, BodyParams, PathParams } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";
import { Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

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
      include: {
        citizen: true,
        categories: true,
      },
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
        status: DLExamStatus.IN_PROGRESS,
      },
      include: {
        citizen: true,
        categories: true,
      },
    });

    return exam;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageDLExams],
  })
  async updateDLEXam(@PathParams("id") examId: string, @BodyParams() body: unknown) {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const exam = await prisma.dLExam.findUnique({ where: { id: examId } });

    if (!exam) {
      throw new NotFound("examNotFound");
    }

    const updated = prisma.dLExam.update({
      where: { id: examId },
      data: {
        citizenId: data.citizenId,
        practiceExam: data.practiceExam as DLExamPassType | null,
        theoryExam: data.theoryExam as DLExamPassType | null,
        status: DLExamStatus.IN_PROGRESS,
      },
      include: {
        citizen: true,
        categories: true,
      },
    });

    return updated;
  }
}
