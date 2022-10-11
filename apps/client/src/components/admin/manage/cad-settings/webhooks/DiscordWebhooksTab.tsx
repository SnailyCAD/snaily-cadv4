import * as React from "react";
import { Button, Loader } from "@snailycad/ui";
import { TabsContent } from "components/shared/TabList";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { cad, DiscordWebhookType } from "@snailycad/types";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { WebhookSettingsField } from "./WebhookSettingsField";
import { toastMessage } from "lib/toastMessage";
import type { GetCADDiscordWebhooksData, PostCADDiscordWebhooksData } from "@snailycad/types/api";

export function DiscordWebhooksTab({ canWarn }: { canWarn: boolean }) {
  const [channels, setChannels] = React.useState<GetCADDiscordWebhooksData>([]);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();

  const INITIAL_VALUES = {
    call911Webhook: makeInitialValue(cad, DiscordWebhookType.CALL_911),
    statusesWebhook: makeInitialValue(cad, DiscordWebhookType.UNIT_STATUS),
    panicButtonWebhook: makeInitialValue(cad, DiscordWebhookType.PANIC_BUTTON),
    boloWebhook: makeInitialValue(cad, DiscordWebhookType.BOLO),
    vehicleImpoundedWebhook: makeInitialValue(cad, DiscordWebhookType.VEHICLE_IMPOUNDED),
    citizenRecordsWebhook: makeInitialValue(cad, DiscordWebhookType.CITIZEN_RECORD),
    warrantsWebhook: makeInitialValue(cad, DiscordWebhookType.WARRANTS),
  };

  React.useEffect(() => {
    void refreshChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshChannels() {
    const { json } = await execute<GetCADDiscordWebhooksData>({
      path: "/admin/manage/cad-settings/discord/webhooks",
      method: "GET",
      noToast: !canWarn,
    });

    if (Array.isArray(json)) {
      setChannels(json);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostCADDiscordWebhooksData>({
      path: "/admin/manage/cad-settings/discord/webhooks",
      method: "POST",
      data: values,
    });

    if (json.id && cad) {
      setCad({ ...cad, miscCadSettingsId: json.id, miscCadSettings: json });
      toastMessage({
        icon: "success",
        title: common("success"),
        message: common("savedSettingsSuccess"),
      });
    }
  }

  return (
    <TabsContent value={SettingsTabs.DiscordWebhooks}>
      <header>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Discord Webhooks</h2>

          <Button onPress={refreshChannels} className="h-fit min-w-fit">
            Refresh Channels
          </Button>
        </div>

        <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">
          Select a channel for each webhook type. This will create a new Discord webhook and send
          webhooks on the respective event type.
        </p>
      </header>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {() => (
          <Form className="mt-5 space-y-5">
            <WebhookSettingsField
              fieldName="call911Webhook"
              channels={channels}
              description="The Discord channel where 911 calls will be sent to."
              label="911 calls channel"
            />

            <WebhookSettingsField
              fieldName="statusesWebhook"
              channels={channels}
              description="The Discord channel where unit status updates will be sent to."
              label="Status updates channel"
            />

            <WebhookSettingsField
              fieldName="panicButtonWebhook"
              channels={channels}
              description="The Discord channel where panic button triggers will be sent to."
              label="Panic button channel"
            />

            <WebhookSettingsField
              fieldName="boloWebhook"
              channels={channels}
              description="The Discord channel where new BOLO's will be sent to."
              label="BOLO's channel"
            />

            <WebhookSettingsField
              fieldName="vehicleImpoundedWebhook"
              channels={channels}
              description="The Discord channel where impounded vehicle notifications will be sent to."
              label="Impounded vehicles channel"
            />

            <WebhookSettingsField
              fieldName="citizenRecordsWebhook"
              channels={channels}
              description="The Discord channel where new arrest reports, tickets, warrants and written warnings will be sent to."
              label="Citizen records channel"
            />

            <WebhookSettingsField
              fieldName="warrantsWebhook"
              channels={channels}
              description="The Discord channel where new warrants will be sent to."
              label="Warrants Channel"
            />

            <Button className="flex items-center" type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}

function makeInitialValue(cad: cad | null, type: string) {
  const webhook = cad?.miscCadSettings?.webhooks?.find((v) => v.type === type);
  if (!webhook) return { id: null, type, extraMessage: "" };

  return {
    id: webhook.channelId,
    extraMessage: webhook.extraMessage ?? "",
    type,
  };
}
