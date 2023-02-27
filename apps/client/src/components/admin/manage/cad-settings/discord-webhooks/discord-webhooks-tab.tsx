import * as React from "react";
import { Button, Loader, TabsContent } from "@snailycad/ui";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { cad, DiscordWebhookType } from "@snailycad/types";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { WebhookSettingsField } from "./WebhookSettingsField";
import { toastMessage } from "lib/toastMessage";
import type { GetCADDiscordWebhooksData, PostCADDiscordWebhooksData } from "@snailycad/types/api";

export function DiscordWebhooksTab() {
  const [channels, setChannels] = React.useState<GetCADDiscordWebhooksData>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const { state, execute } = useFetch();
  const tErrors = useTranslations("Errors");
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();
  const t = useTranslations("DiscordWebhooksTab");

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
    const { json, error } = await execute<GetCADDiscordWebhooksData>({
      path: "/admin/manage/cad-settings/discord/webhooks",
      method: "GET",
      noToast: true,
    });

    if (error) {
      setFetchError(error);
    }

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
          <h2 className="text-2xl font-semibold">{t("discordWebhooks")}</h2>

          <Button onPress={refreshChannels} className="h-fit min-w-fit">
            {t("refreshChannels")}
          </Button>
        </div>

        <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">
          {t("discordWebhooksInfo")}
        </p>
      </header>

      {fetchError ? (
        <div role="alert" className="p-2 px-4 my-4 mb-5 text-black rounded-md shadow bg-red-400">
          <p>{tErrors(fetchError)}</p>
        </div>
      ) : null}

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {() => (
          <Form className="mt-5 space-y-5">
            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="call911Webhook"
              channels={channels}
              description={t("calls911ChannelInfo")}
              label={t("calls911Channel")}
            />

            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="statusesWebhook"
              channels={channels}
              description={t("statusUpdatesChannelInfo")}
              label={t("statusUpdatesChannel")}
            />

            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="panicButtonWebhook"
              channels={channels}
              description={t("panicButtonChannelInfo")}
              label={t("panicButtonChannel")}
            />

            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="boloWebhook"
              channels={channels}
              description={t("bolosChannelInfo")}
              label={t("bolosChannel")}
            />

            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="vehicleImpoundedWebhook"
              channels={channels}
              description={t("impoundedVehicleChannelInfo")}
              label={t("impoundedVehicleChannel")}
            />

            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="citizenRecordsWebhook"
              channels={channels}
              description={t("citizenRecordsChannelInfo")}
              label={t("citizenRecordsChannel")}
            />

            <WebhookSettingsField
              disabled={!!fetchError}
              fieldName="warrantsWebhook"
              channels={channels}
              description={t("warrantsChannelInfo")}
              label={t("warrantsChannel")}
            />

            <Button
              className="flex items-center"
              type="submit"
              disabled={!!fetchError || state === "loading"}
            >
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
