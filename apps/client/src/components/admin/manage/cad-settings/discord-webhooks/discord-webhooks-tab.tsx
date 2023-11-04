import * as React from "react";
import { Alert, Button, Loader } from "@snailycad/ui";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { type cad, DiscordWebhookType } from "@snailycad/types";
import { WebhookSettingsField } from "./WebhookSettingsField";
import { toastMessage } from "lib/toastMessage";
import type { GetCADDiscordWebhooksData, PostCADDiscordWebhooksData } from "@snailycad/types/api";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

function createInitialValues(cad: cad | null) {
  const webhookTypes = Object.values(DiscordWebhookType);

  return webhookTypes.reduce(
    (obj, type) => ({
      ...obj,
      [type]: makeInitialValue(cad, type),
    }),
    {},
  );
}

export function DiscordWebhooksTab() {
  const [channels, setChannels] = React.useState<GetCADDiscordWebhooksData>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const { state, execute } = useFetch();
  const tErrors = useTranslations("Errors");
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();
  const t = useTranslations("DiscordWebhooksTab");

  const INITIAL_VALUES = createInitialValues(cad);

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
        <Alert
          type="error"
          className="my-5"
          title={tErrors("unknown")}
          message={tErrors(fetchError)}
        />
      ) : null}

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {() => (
          <Form className="mt-5 space-y-5">
            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.CALL_911}
              channels={channels}
              description={t("calls911ChannelInfo")}
              label={t("calls911Channel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.UNIT_STATUS}
              channels={channels}
              description={t("statusUpdatesChannelInfo")}
              label={t("statusUpdatesChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.PANIC_BUTTON}
              channels={channels}
              description={t("panicButtonChannelInfo")}
              label={t("panicButtonChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.BOLO}
              channels={channels}
              description={t("bolosChannelInfo")}
              label={t("bolosChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.VEHICLE_IMPOUNDED}
              channels={channels}
              description={t("impoundedVehicleChannelInfo")}
              label={t("impoundedVehicleChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.CITIZEN_RECORD}
              channels={channels}
              description={t("citizenRecordsChannelInfo")}
              label={t("citizenRecordsChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.WARRANTS}
              channels={channels}
              description={t("warrantsChannelInfo")}
              label={t("warrantsChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.BLEETER_POST}
              channels={channels}
              description={t("bleeterPostChannelInfo")}
              label={t("bleeterPostChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.CITIZEN_DECLARED_DEAD}
              channels={channels}
              description={t("citizenDeclaredDeadChannelInfo")}
              label={t("citizenDeclaredDeadChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.DEPARTMENT_WHITELIST_STATUS}
              channels={channels}
              description={t("departmentWhitelistStatusChannelInfo")}
              label={t("departmentWhitelistStatusChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.USER_WHITELIST_STATUS}
              channels={channels}
              description={t("userWhitelistStatusChannelInfo")}
              label={t("userWhitelistStatusChannel")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.LEO_INCIDENT_CREATED}
              channels={channels}
              description={t("leoIncidentCreatedInfo")}
              label={t("leoIncidentCreated")}
            />

            <WebhookSettingsField
              disabled={Boolean(fetchError)}
              fieldName={DiscordWebhookType.EMS_FD_INCIDENT_CREATED}
              channels={channels}
              description={t("emsFdIncidentCreatedInfo")}
              label={t("emsFdIncidentCreated")}
            />

            <Button
              className="flex items-center float-right"
              type="submit"
              disabled={state === "loading"}
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
