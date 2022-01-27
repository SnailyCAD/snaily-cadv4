import { Controller } from "@tsed/di";
import { Get } from "@tsed/schema";
import { prisma } from "lib/prisma";
import glob from "glob";
import { join } from "node:path";
import { statSync } from "node:fs";
import { UseBeforeEach } from "@tsed/common";
import { IsAuth } from "middlewares/index";
import { WhitelistStatus } from ".prisma/client";

@Controller("/admin")
@UseBeforeEach(IsAuth)
export class AdminController {
  @Get("/")
  async getData() {
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

  private async imageData() {
    const path = join(__dirname, "../../../", "public");
    const items = glob.sync(`${path}/**/*.*`);
    let totalSize = 0;

    await Promise.all(
      items.map((item) => {
        const stat = statSync(join(item));
        totalSize += stat.size;
      }),
    );

    return { count: items.length, totalSize };
  }
}
