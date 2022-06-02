import process from "node:process";
import { Controller } from "@tsed/di";
import { Context } from "@tsed/platform-params";
import { Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { BadRequest } from "@tsed/exceptions";
import { MultipartFile, PlatformMulterFile, UseBefore } from "@tsed/common";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import fs from "node:fs";
import type { cad } from "@prisma/client";
import { randomUUID } from "node:crypto";

@Controller("/admin/manage/cad-settings/image")
export class ManageCitizensController {
  @UseBefore(IsAuth)
  @Post("/")
  async uploadLogoToCAD(
    @Context("cad") cad: cad,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/cad/${cad.id}.${extension}`;

    const [data] = await Promise.all([
      prisma.cad.update({
        where: { id: cad.id },
        data: { logoId: `${cad.id}.${extension}` },
        select: { logoId: true },
      }),
      fs.writeFileSync(path, file.buffer),
    ]);

    return data;
  }

  @UseBefore(IsAuth)
  @Post("/auth")
  async uploadAuthImagesToCAD(
    @Context("cad") cad: cad,
    @MultipartFile("authScreenHeaderImageId") header?: PlatformMulterFile,
    @MultipartFile("authScreenBgImageId") background?: PlatformMulterFile,
  ) {
    await Promise.all(
      [header, background].map(async (file) => {
        if (!file) return;

        if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
          throw new BadRequest("invalidImageType");
        }

        // "image/png" -> "png"
        const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
        const id = randomUUID();
        const path = `${process.cwd()}/public/cad/${id}.${extension}`;

        const [data] = await Promise.all([
          prisma.miscCadSettings.update({
            where: { id: cad.miscCadSettingsId! },
            data: { [file.fieldname]: `${id}.${extension}` },
          }),
          fs.writeFileSync(path, file.buffer),
        ]);

        return data;
      }),
    );
  }
}
