import type { DiscordWebhookType } from "@prisma/client";
import { RAW_WEBHOOKS_SCHEMA } from "@snailycad/schemas";
import { cad, Rank } from "@snailycad/types";
import { BodyParams, Context, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { ContentType, Get, Post } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { Permissions, UsePermissions } from "middlewares/use-permissions";

@Controller("/admin/manage/cad-settings/webhooks")
@ContentType("application/json")
@UseBeforeEach(IsAuth)
export class WebhooksController {
  @Get("/")
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
    fallback: (u) => u.rank === Rank.OWNER,
  })
  async getWebhooks() {
    const webhooks = await prisma.rawWebhook.findMany({});

    return webhooks;
  }

  @Post("/")
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
    fallback: (u) => u.rank === Rank.OWNER,
  })
  async saveWebhooks(@BodyParams() body: unknown, @Context("cad") cad: cad) {
    const data = validateSchema(RAW_WEBHOOKS_SCHEMA, body);

    const values = Object.values(data);

    await Promise.all(
      values.map(async (webhookData) => {
        if (!webhookData.url) return;

        const createUpdateData = {
          type: webhookData.type as DiscordWebhookType,
          miscCadSettingsId: cad.miscCadSettingsId!,
          url: webhookData.url,
        };

        await prisma.rawWebhook.upsert({
          where: { type: webhookData.type as DiscordWebhookType },
          create: createUpdateData,
          update: createUpdateData,
        });
      }),
    );

    const updatedCadSettings = await prisma.miscCadSettings.findUnique({
      where: { id: cad.miscCadSettingsId! },
      include: { webhooks: true },
    });

    // todo: audit log
    // await createAuditLogEntry({
    //   action: {
    //     type: AuditLogActionType.UpdateDiscordWebhooks,
    //     previous: cad.miscCadSettings?.webhooks ?? [],
    //     new: updatedCadSettings?.webhooks ?? [],
    //   },
    //   prisma,
    //   executorId: sessionUserId,
    // });

    return updatedCadSettings!;
  }
}
