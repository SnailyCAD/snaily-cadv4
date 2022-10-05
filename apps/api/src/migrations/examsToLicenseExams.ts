import { prisma } from "lib/prisma";

export async function examsToLicenseExams() {
  const [features, weaponExams, dlExams] = await prisma.$transaction([
    prisma.cadFeature.findMany({
      where: { OR: [{ feature: "DL_EXAMS" }, { feature: "WEAPON_EXAMS" }] },
    }),
    prisma.weaponExam.findMany({ include: { categories: true } }),
    prisma.dLExam.findMany({ include: { categories: true } }),
  ]);

  await Promise.all([
    ...weaponExams.map(async (weaponExam) => {
      const exam = await prisma.licenseExam.create({
        data: {
          citizenId: weaponExam.citizenId,
          licenseId: weaponExam.licenseId,
          createdAt: weaponExam.createdAt,
          updatedAt: weaponExam.updatedAt,
          status: weaponExam.status,
          theoryExam: weaponExam.theoryExam,
          practiceExam: weaponExam.practiceExam,
          type: "FIREARM",
        },
      });

      await prisma.$transaction(
        weaponExam.categories.map((category) =>
          prisma.licenseExam.update({
            where: { id: exam.id },
            data: { categories: { connect: { id: category.id } } },
          }),
        ),
      );

      await prisma.weaponExam.delete({
        where: { id: weaponExam.id },
      });
    }),
    ...dlExams.map(async (dlExam) => {
      const exam = await prisma.licenseExam.create({
        data: {
          citizenId: dlExam.citizenId,
          licenseId: dlExam.licenseId,
          createdAt: dlExam.createdAt,
          updatedAt: dlExam.updatedAt,
          status: dlExam.status,
          theoryExam: dlExam.theoryExam,
          practiceExam: dlExam.practiceExam,
          type: "DRIVER",
        },
      });

      await prisma.$transaction(
        dlExam.categories.map((category) =>
          prisma.licenseExam.update({
            where: { id: exam.id },
            data: { categories: { connect: { id: category.id } } },
          }),
        ),
      );

      await prisma.dLExam.delete({
        where: { id: dlExam.id },
      });
    }),
    ...features.map(async (feature) => {
      await prisma.cadFeature.upsert({
        where: { feature: "LICENSE_EXAMS" },
        create: { feature: "LICENSE_EXAMS", cadId: feature.cadId, isEnabled: true },
        update: {},
      });

      await prisma.cadFeature.delete({
        where: { feature: feature.feature },
      });
    }),
  ]);
}
