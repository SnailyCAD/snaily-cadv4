import { LIVE_MAP_SETTINGS } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { ContentType, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { MultipartFile, type PlatformMulterFile, UseBefore } from "@tsed/common";
import { validateSchema } from "lib/data/validate-schema";
import { type cad } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import type { MiscCadSettings } from "@snailycad/types";
import sharp from "sharp";
import { getLastOfArray, manyToManyHelper } from "lib/data/many-to-many";
import { allowedFileExtensions } from "@snailycad/config";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { captureException } from "@sentry/node";

@Controller("/admin/manage/cad-settings/live-map")
@ContentType("application/json")
export class CADSettingsLiveMapController {
  @Put("/")
  @UseBefore(IsAuth)
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
  })
  async updateMiscSettings(
    @Context("sessionUserId") sessionUserId: string,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADMiscSettingsData> {
    const data = validateSchema(LIVE_MAP_SETTINGS, body);

    const connectDisconnectArr = manyToManyHelper(
      cad.miscCadSettings.liveMapURLs ?? [],
      data.liveMapURLs ?? [],
      { showUpsert: true, customAccessorKey: "id" },
    );

    const updated = getLastOfArray(
      await prisma.$transaction(
        connectDisconnectArr.map((item, idx) => {
          const isLast = idx === connectDisconnectArr.length - 1;

          return prisma.miscCadSettings.update({
            where: { id: cad.miscCadSettingsId ?? "null" },
            data: { liveMapURLs: item, liveMapURL: null },
            include: isLast ? { webhooks: true } : undefined,
          });
        }),
      ),
    );

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.MiscCadSettingsUpdate,
        new: updated,
        previous: cad.miscCadSettings,
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Put("/tiles")
  @UseBefore(IsAuth)
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
  })
  async updateLiveMapTiles(@MultipartFile("tiles") files: PlatformMulterFile[]) {
    const allowedName = /minimap_sea_-?\d*(\.\d+)?_-?\d*(\.\d+)?/;

    if (!Array.isArray(files)) {
      throw new ExtendedBadRequest({ tiles: "Invalid files" });
    }

    for (const file of files) {
      const fileType = file.mimetype as (typeof allowedFileExtensions)[number];
      if (!allowedFileExtensions.includes(fileType)) {
        throw new ExtendedBadRequest({ tiles: "Invalid file type" });
      }

      if (!allowedName.test(file.originalname)) {
        throw new ExtendedBadRequest({ tiles: "Invalid file name" });
      }

      const sharpImage = sharp(file.buffer).webp({ quality: 80 });

      const pathToClientPublicDir = `${process.cwd()}/../client/public/tiles/${
        file.originalname
      }.webp`;

      try {
        await sharpImage.toFile(pathToClientPublicDir);
      } catch (err) {
        captureException(err);
        throw new ExtendedBadRequest({
          tiles:
            "Unable to write to the file destination. Please make sure SnailyCAD has the correct write permissions to these files/folder",
        });
      }
    }

    return true;
  }
}
