import { Controller } from "@tsed/di";
import { Context } from "@tsed/platform-params";
import { Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { BadRequest } from "@tsed/exceptions";
import { MultipartFile, PlatformMulterFile, UseBefore } from "@tsed/common";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import fs from "node:fs/promises";
import { cad, Rank } from "@prisma/client";
import { Permissions } from "@snailycad/permissions";
import { UsePermissions } from "middlewares/UsePermissions";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { getImageWebPPath } from "utils/image";

@Controller("/admin/manage/cad-settings/image")
export class ManageCitizensController {
  @UseBefore(IsAuth)
  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async uploadLogoToCAD(
    @Context("cad") cad: cad,
    @MultipartFile("image") file?: PlatformMulterFile,
  ) {
    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    const image = await getImageWebPPath({ buffer: file.buffer, pathType: "cad", id: cad.id });

    const [data] = await Promise.all([
      prisma.cad.update({
        where: { id: cad.id },
        data: { logoId: image.fileName },
        select: { logoId: true },
      }),
      fs.writeFile(image.path, image.imageBuffer),
    ]);

    return data;
  }

  @UseBefore(IsAuth)
  @Post("/auth")
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async uploadAuthImagesToCAD(
    @Context("cad") cad: cad,
    @MultipartFile("files", 4) files: PlatformMulterFile[],
  ) {
    await Promise.all(
      files.map(async (file) => {
        if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
          throw new BadRequest("invalidImageType");
        }

        const image = await getImageWebPPath({ buffer: file.buffer, pathType: "cad" });

        const [data] = await Promise.all([
          prisma.miscCadSettings.update({
            where: { id: cad.miscCadSettingsId! },
            data: { [file.originalname]: image.fileName },
          }),
          fs.writeFile(image.path, image.imageBuffer),
        ]);

        return data;
      }),
    );
  }
}
