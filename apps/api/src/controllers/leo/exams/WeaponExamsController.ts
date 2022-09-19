import {
  WeaponExam,
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
import type * as APITypes from "@snailycad/types/api";

const dlExamIncludes = {
  citizen: true,
  license: true,
  categories: { include: { value: true } },
};

@Controller("/leo/weapon-exams")
@UseBeforeEach(IsAuth)
export class WeaponExamsController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ViewWeaponExams, Permissions.ManageWeaponExams],
  })
  async getAllDLExams(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetWeaponExamsData> {
    const where: Prisma.DLExamWhereInput | undefined = query
      ? {
          OR: [
            { license: { value: { contains: query, mode: "insensitive" } } },
            { citizen: { name: { contains: query, mode: "insensitive" } } },
            { citizen: { surname: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined;

    const [exams, totalCount] = await prisma.$transaction([
      prisma.weaponExam.findMany({
        include: dlExamIncludes,
        orderBy: { createdAt: "desc" },
        where,
        skip,
        take: 35,
      }),
      prisma.weaponExam.count({ where }),
    ]);

    return { exams, totalCount };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageWeaponExams],
  })
  async createDLEXam(@BodyParams() body: unknown): Promise<APITypes.PostWeaponExamsData> {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const status = this.getExamStatus(data);
    const exam = await prisma.weaponExam.create({
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
        prisma.weaponExam.update({
          where: { id: exam.id },
          data: { categories: item },
        }),
      ),
    );

    if (status === DLExamStatus.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.weaponExam.findUniqueOrThrow({
      where: { id: exam.id },
      include: dlExamIncludes,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor,
    permissions: [Permissions.ManageWeaponExams],
  })
  async updateDLEXam(
    @PathParams("id") examId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutWeaponExamByIdData> {
    const data = validateSchema(DL_EXAM_SCHEMA, body);

    const exam = await prisma.weaponExam.findUnique({
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
        prisma.weaponExam.update({
          where: { id: exam.id },
          data: { categories: item },
        }),
      ),
    );

    const status = this.getExamStatus(data);
    if (status === DLExamStatus.PASSED) {
      await this.grantLicenseToCitizen(exam);
    }

    const updated = await prisma.weaponExam.update({
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
    permissions: [Permissions.ManageWeaponExams],
  })
  async deleteDLEXam(@PathParams("id") examId: string): Promise<APITypes.DeleteWeaponExamByIdData> {
    const exam = await prisma.weaponExam.findUnique({
      where: { id: examId },
      include: { categories: true },
    });

    if (!exam) {
      throw new NotFound("examNotFound");
    }

    await prisma.weaponExam.delete({
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
    exam: WeaponExam & { categories: DriversLicenseCategoryValue[] },
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
        data: { weaponLicenseId: exam.licenseId },
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
