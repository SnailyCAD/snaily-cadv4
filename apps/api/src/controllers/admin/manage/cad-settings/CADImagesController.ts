import { Controller } from "@tsed/di";
import { Context } from "@tsed/platform-params";
import { ContentType, Post } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { CAD_SELECT, IsAuth } from "middlewares/is-auth";
import { BadRequest } from "@tsed/exceptions";
import { MultipartFile, PlatformMulterFile, UseBefore } from "@tsed/common";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import fs from "node:fs/promises";
import { cad, Feature, MiscCadSettings, Rank } from "@prisma/client";
import { Permissions } from "@snailycad/permissions";
import { UsePermissions } from "middlewares/use-permissions";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { getImageWebPPath } from "lib/images/get-image-webp-path";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import type { User } from "@snailycad/types";

@Controller("/admin/manage/cad-settings/image")
@ContentType("application/json")
export class ManageCitizensController {
  @UseBefore(IsAuth)
  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async uploadLogoToCAD(
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @Context("user") user: User,
    @MultipartFile("image") file?: PlatformMulterFile,
  ) {
    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    const image = await getImageWebPPath({
      buffer: file.buffer,
      pathType: "cad",
      id: `${cad.id}-${file.originalname.split(".")[0]}`,
    });

    const previousImage = cad.logoId ? `${process.cwd()}/public/cad/${cad.logoId}` : undefined;
    if (previousImage) {
      await fs.rm(previousImage, { force: true });
    }

    const [data] = await Promise.all([
      prisma.cad.update({
        where: { id: cad.id },
        data: { logoId: image.fileName },
        select: CAD_SELECT(user, true),
      }),
      fs.writeFile(image.path, image.buffer),
    ]);

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.CadSettingsUpdate,
        previous: cad as any,
        new: data as any,
      },
      prisma,
      executorId: user.id,
    });

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
    if (!Array.isArray(files)) {
      throw new BadRequest("mustUploadMultipleImagesUnderFiles");
    }

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
          fs.writeFile(image.path, image.buffer),
        ]);

        return data;
      }),
    );
  }
}
