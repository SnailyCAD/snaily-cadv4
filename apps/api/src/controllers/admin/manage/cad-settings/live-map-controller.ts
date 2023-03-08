import { LIVE_MAP_SETTINGS } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { ContentType, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { MultipartFile, PlatformMulterFile, UseBefore } from "@tsed/common";
import { validateSchema } from "lib/data/validate-schema";
import { cad, Rank } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import type { MiscCadSettings } from "@snailycad/types";
import sharp from "sharp";

@Controller("/admin/manage/cad-settings/live-map")
@ContentType("application/json")
export class CADSettingsLiveMapController {
  @Put("/")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateMiscSettings(
    @Context("sessionUserId") sessionUserId: string,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADMiscSettingsData> {
    const data = validateSchema(LIVE_MAP_SETTINGS, body);

    const updated = await prisma.miscCadSettings.update({
      where: {
        id: cad.miscCadSettingsId ?? "null",
      },
      data: { liveMapURL: data.liveMapURL },
      include: { webhooks: true },
    });

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
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateLiveMapTiles(@MultipartFile("tiles") files: PlatformMulterFile[]) {
    for (const file of files) {
      const sharpImage = sharp(file.buffer).webp({ quality: 80 });

      const pathToClientPublicDir = `${process.cwd()}/../client/public/tiles/${
        file.originalname
      }.webp`;
      await sharpImage.toFile(pathToClientPublicDir);
    }

    return true;
  }
}
