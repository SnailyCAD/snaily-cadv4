import { Controller } from "@tsed/di";
import { Context } from "@tsed/platform-params";
import { Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { BadRequest } from "@tsed/exceptions";
import { MultipartFile, PlatformMulterFile, UseBefore } from "@tsed/common";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import fs from "node:fs";
import { cad } from "@prisma/client";
import { randomUUID } from "node:crypto";

@Controller("/admin/manage/cad-settings/image")
export class ManageCitizensController {
  @UseBefore(IsAuth)
  @Post("/")
  async uploadLogoToCAD(@Context() ctx: Context, @MultipartFile("image") file: PlatformMulterFile) {
    const cad = ctx.get("cad");

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/cad/${cad.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        logoId: `${cad.id}.${extension}`,
      },
      select: {
        logoId: true,
      },
    });

    return data;
  }

  @UseBefore(IsAuth)
  @Post("/auth")
  async uploadAuthImagesToCAD(
    @Context() ctx: Context,
    @MultipartFile("authScreenHeaderImageId") header?: PlatformMulterFile,
    @MultipartFile("authScreenBgImageId") background?: PlatformMulterFile,
  ) {
    const cad = ctx.get("cad") as cad;

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

        await fs.writeFileSync(path, file.buffer);

        const data = await prisma.miscCadSettings.update({
          where: {
            id: cad.miscCadSettingsId!,
          },
          data: {
            [file.fieldname]: `${id}.${extension}`,
          },
        });

        return data;
      }),
    );
  }
}
