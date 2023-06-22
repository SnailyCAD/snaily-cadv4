import { Controller, Get, Res } from "@nestjs/common";
import { getCADVersion } from "@snailycad/utils/version";
import { FastifyReply } from "fastify";
import { Description } from "~/decorators/description";

@Controller("/")
export class MainController {
  @Get(["/", "/v1"])
  @Description("Get the current version of the CAD")
  async getCADVersion(@Res() res: FastifyReply) {
    const versions = await getCADVersion();

    res.header("Content-Type", "text/html");
    return res.send(
      `<html><head><title>SnailyCAD API</title></head><body>200 Success. Current CAD Version: ${versions?.currentVersion} - ${versions?.currentCommitHash}</body></html>`,
    );
  }
}
