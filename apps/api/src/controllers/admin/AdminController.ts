import { Controller } from "@tsed/di";
import { Get, Description, ContentType } from "@tsed/schema";
import { prisma } from "lib/prisma";
import glob from "glob";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import { UseBefore } from "@tsed/common";
import { IsAuth } from "middlewares/IsAuth";
import { Rank, WhitelistStatus } from "@prisma/client";
import { UsePermissions } from "middlewares/UsePermissions";
import { defaultPermissions } from "@snailycad/permissions";
import type { GetAdminDashboardData } from "@snailycad/types/api";
import { fetch } from "undici";
import { getCADVersion } from "@snailycad/utils/version";
import { captureException } from "@sentry/node";

@Controller("/admin")
@ContentType("application/json")
export class AdminController {
  @Get("/")
  @Description("Get simple CAD stats")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: defaultPermissions.allDefaultAdminPermissions,
  })
  @UseBefore(IsAuth)
  async getData(): Promise<GetAdminDashboardData> {
    const [activeUsers, pendingUsers, bannedUsers] = await Promise.all([
      await prisma.user.count({ where: { whitelistStatus: WhitelistStatus.ACCEPTED } }),
      await prisma.user.count({ where: { whitelistStatus: WhitelistStatus.PENDING } }),
      await prisma.user.count({ where: { banned: true } }),
    ]);

    const [createdCitizens, citizensInBolo, arrestCitizens, deadCitizens] = await Promise.all([
      await prisma.citizen.count(),
      await prisma.bolo.count({ where: { type: "PERSON" } }),
      await prisma.citizen.count({ where: { Record: { some: { type: "ARREST_REPORT" } } } }),
      await prisma.citizen.count({ where: { dead: true } }),
    ]);

    const [vehicles, impoundedVehicles, vehiclesInBOLO] = await Promise.all([
      await prisma.registeredVehicle.count(),
      await prisma.registeredVehicle.count({ where: { impounded: true } }),
      await prisma.bolo.count({ where: { type: "VEHICLE" } }),
    ]);

    const imageData = await this.imageData().catch(() => null);

    return {
      activeUsers,
      pendingUsers,
      bannedUsers,

      createdCitizens,
      citizensInBolo,
      arrestCitizens,
      deadCitizens,

      vehicles,
      impoundedVehicles,
      vehiclesInBOLO,
      imageData: imageData ?? {
        count: 0,
        totalSize: 0,
      },
    };
  }

  @Get("/changelog")
  @Description("Get the changelog from GitHub.")
  async getChangelog() {
    try {
      const version = await getCADVersion();
      console.log({ version });

      const response = await fetch(
        `https://api.github.com/repos/SnailyCAD/snaily-cadv4/releases/tags/${version?.currentVersion}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );

      const json = (await response.json()) as { body: string };
      return json.body;
    } catch (e) {
      captureException(e);
      return null;
    }
  }

  private async imageData() {
    try {
      const path = join(__dirname, "../../../", "public");
      const items = glob.sync(`${path}/**/*.*`);
      let totalSize = 0;

      await Promise.all(
        items.map(async (item) => {
          const { size } = await stat(join(item));
          totalSize += size;
        }),
      );

      return { count: items.length, totalSize };
    } catch {
      return null;
    }
  }
}
