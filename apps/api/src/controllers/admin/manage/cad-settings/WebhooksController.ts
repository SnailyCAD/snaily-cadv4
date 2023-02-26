import { Controller } from "@tsed/di";
import { ContentType, Get } from "@tsed/schema";
import { prisma } from "lib/data/prisma";

@Controller("/admin/manage/cad-settings/webhooks")
@ContentType("application/json")
export class WebhooksController {
  @Get("/")
  async getWebhooks() {
    const webhooks = await prisma.rawWebhook.findMany({});

    return webhooks;
  }
}
