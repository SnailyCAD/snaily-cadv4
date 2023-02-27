import * as React from "react";
import { Button, Loader, TabsContent } from "@snailycad/ui";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { DiscordWebhookType } from "@snailycad/types";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { WebhookSettingsField } from "../discord-webhooks/WebhookSettingsField";
import { toastMessage } from "lib/toastMessage";
import type { GetCADDiscordWebhooksData, PostCADDiscordWebhooksData } from "@snailycad/types/api";
import { useQuery } from "@tanstack/react-query";

export function RawWebhooksTab() {
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const { state, execute } = useFetch();
  const tErrors = useTranslations("Errors");
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();
  const t = useTranslations("RawWebhooksTab");

  const { data = [] } = useQuery({
    queryKey: ["getRawWebhooks"],
    queryFn: async () => {
      const { json, error } = await execute<GetCADDiscordWebhooksData>({
        path: "/admin/manage/cad-settings/webhooks",
        method: "GET",
        noToast: true,
      });

      if (error) {
        setFetchError(error);
        return [];
      }

      return json;
    },
  });

  const INITIAL_VALUES = {
    call911Webhook: makeInitialValue(data, DiscordWebhookType.CALL_911),
    statusesWebhook: makeInitialValue(data, DiscordWebhookType.UNIT_STATUS),
    panicButtonWebhook: makeInitialValue(data, DiscordWebhookType.PANIC_BUTTON),
    boloWebhook: makeInitialValue(data, DiscordWebhookType.BOLO),
    vehicleImpoundedWebhook: makeInitialValue(data, DiscordWebhookType.VEHICLE_IMPOUNDED),
    citizenRecordsWebhook: makeInitialValue(data, DiscordWebhookType.CITIZEN_RECORD),
    warrantsWebhook: makeInitialValue(data, DiscordWebhookType.WARRANTS),
  };

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostCADDiscordWebhooksData>({
      path: "/admin/manage/cad-settings/webhooks",
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
    <TabsContent value={SettingsTabs.RawWebhooks}>
      <header>
        <h2 className="text-2xl font-semibold">{t("rawWebhooks")}</h2>

        <p className="my-3 text-neutral-700 dark:text-gray-400 max-w-2xl">{t("rawWebhooksInfo")}</p>
      </header>

      {fetchError ? (
        <div role="alert" className="p-2 px-4 my-2 mb-5 text-black rounded-md shadow bg-red-400">
          <p>{tErrors(fetchError)}</p>
        </div>
      ) : null}

      <Formik enableReinitialize onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {() => (
          <Form className="mt-5 space-y-5">
            <WebhookSettingsField
              fieldName="call911Webhook"
              isRawWebhook
              label={t("calls911WebhookURL")}
            />

            <WebhookSettingsField
              fieldName="statusesWebhook"
              isRawWebhook
              label={t("statusUpdateWebhookURL")}
            />

            <WebhookSettingsField
              fieldName="panicButtonWebhook"
              isRawWebhook
              label={t("panicButtonWebhookURL")}
            />

            <WebhookSettingsField
              fieldName="boloWebhook"
              isRawWebhook
              label={t("bolosWebhookURL")}
            />

            <WebhookSettingsField
              fieldName="vehicleImpoundedWebhook"
              isRawWebhook
              label={t("impoundedVehicleWebhookURL")}
            />

            <WebhookSettingsField
              fieldName="citizenRecordsWebhook"
              isRawWebhook
              label={t("citizenRecordsWebhookURL")}
            />

            <WebhookSettingsField
              fieldName="warrantsWebhook"
              isRawWebhook
              label={t("warrantsWebhookURL")}
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

function makeInitialValue(webhooks: any[], type: DiscordWebhookType) {
  const webhook = webhooks.find((v) => v.type === type);
  if (!webhook) return { id: null, type, url: "" };

  return {
    id: webhook.channelId,
    url: webhook.url,
    type,
  };
}
