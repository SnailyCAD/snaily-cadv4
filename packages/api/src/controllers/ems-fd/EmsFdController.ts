import process from "node:process";
import { Controller, UseBeforeEach, Use, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA, MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { type MiscCadSettings, ShouldDoType, type User } from "@prisma/client";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { IsAuth } from "middlewares/IsAuth";
import { ActiveDeputy } from "middlewares/ActiveDeputy";
import fs from "node:fs";
import { unitProperties } from "lib/leo/activeOfficer";
import { validateImgurURL } from "utils/image";
import { validateSchema } from "lib/validateSchema";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { validateMaxDepartmentsEachPerUser } from "lib/leo/utils";

@Controller("/ems-fd")
@UseBeforeEach(IsAuth)
export class EmsFdController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async getUserDeputies(@Context("user") user: User) {
    const deputies = await prisma.emsFdDeputy.findMany({
      where: {
        userId: user.id,
      },
      include: unitProperties,
    });

    return { deputies };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async createEmsFdDeputy(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
  ) {
    const data = validateSchema(CREATE_OFFICER_SCHEMA, body);

    const division = await prisma.divisionValue.findFirst({
      where: {
        id: data.division,
        departmentId: data.department,
      },
    });

    if (!division) {
      throw new ExtendedBadRequest({ division: "divisionNotInDepartment" });
    }

    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "emsFdDeputy",
    });

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const deputy = await prisma.emsFdDeputy.create({
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        userId: user.id,
        departmentId: data.department,
        divisionId: data.division!,
        badgeNumber: data.badgeNumber,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
      },
      include: unitProperties,
    });

    return deputy;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async updateDeputy(
    @PathParams("id") deputyId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
  ) {
    const data = validateSchema(CREATE_OFFICER_SCHEMA, body);

    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        id: deputyId,
        userId: user.id,
      },
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
    }

    const division = await prisma.divisionValue.findFirst({
      where: {
        id: data.division,
        departmentId: data.department,
      },
    });

    if (!division) {
      throw new ExtendedBadRequest({ division: "divisionNotInDepartment" });
    }

    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "emsFdDeputy",
      unitId: deputy.id,
    });

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const updated = await prisma.emsFdDeputy.update({
      where: {
        id: deputy.id,
      },
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        departmentId: data.department,
        divisionId: data.division!,
        badgeNumber: data.badgeNumber,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
      },
      include: unitProperties,
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async deleteDeputy(@PathParams("id") id: string, @Context() ctx: Context) {
    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: ctx.get("user").id,
        id,
      },
    });

    if (!deputy) {
      throw new NotFound("deputyNotFound");
    }

    await prisma.emsFdDeputy.delete({
      where: {
        id: deputy.id,
      },
    });

    return true;
  }

  @Use(ActiveDeputy)
  @Get("/active-deputy")
  @UsePermissions({
    fallback: (u) => u.isEmsFd || u.isLeo || u.isDispatch,
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  async getActiveDeputy(@Context() ctx: Context) {
    return ctx.get("activeDeputy");
  }

  @Get("/active-deputies")
  @Description("Get all the active EMS/FD deputies")
  @UsePermissions({
    fallback: (u) => u.isEmsFd || u.isLeo || u.isDispatch,
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  async getActiveDeputies() {
    const deputies = await prisma.emsFdDeputy.findMany({
      where: {
        status: {
          NOT: {
            shouldDo: ShouldDoType.SET_OFF_DUTY,
          },
        },
      },
      include: unitProperties,
    });

    return Array.isArray(deputies) ? deputies : [deputies];
  }
  @Use(ActiveDeputy)
  @Post("/medical-record")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async createMedicalRecord(@BodyParams() body: unknown) {
    const data = validateSchema(MEDICAL_RECORD_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        citizenId: citizen.id,
        userId: citizen.userId,
        type: data.type,
        description: data.description,
        bloodGroupId: data.bloodGroup ?? null,
      },
    });

    return medicalRecord;
  }

  @Use(ActiveDeputy)
  @Post("/declare/:citizenId")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async declareCitizenDeadOrAlive(@PathParams("citizenId") citizenId: string) {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        dead: !citizen.dead,
        dateOfDead: citizen.dead ? null : new Date(),
      },
    });

    return updated;
  }

  @Post("/image/:id")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async uploadImageToOfficer(
    @Context("user") user: User,
    @PathParams("id") deputyId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const deputy = await prisma.emsFdDeputy.findFirst({
      where: {
        userId: user.id,
        id: deputyId,
      },
    });

    if (!deputy) {
      throw new NotFound("Not Found");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/units/${deputy.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.emsFdDeputy.update({
      where: {
        id: deputyId,
      },
      data: {
        imageId: `${deputy.id}.${extension}`,
      },
      select: {
        imageId: true,
      },
    });

    return data;
  }
}
