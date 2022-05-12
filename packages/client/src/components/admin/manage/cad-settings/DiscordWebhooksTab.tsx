import * as React from "react";
import { Button } from "components/Button";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { TabsContent } from "components/shared/TabList";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { SettingsFormField } from "components/form/SettingsFormField";
import { cad, DiscordWebhookType } from "@snailycad/types";
import { Textarea } from "components/form/Textarea";
import { FormField } from "components/form/FormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";

interface DiscordChannel {
  name: string;
  id: string;
}

export function DiscordWebhooksTab({ canWarn }: { canWarn: boolean }) {
  const [channels, setChannels] = React.useState<DiscordChannel[]>([]);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { cad } = useAuth();

  const INITIAL_VALUES = {
    call911Webhook: makeInitialValue(cad!, DiscordWebhookType.CALL_911),
    statusesWebhook: makeInitialValue(cad!, DiscordWebhookType.UNIT_STATUS),
    panicButtonWebhook: makeInitialValue(cad!, DiscordWebhookType.PANIC_BUTTON),
    boloWebhook: makeInitialValue(cad!, DiscordWebhookType.BOLO),
    vehicleImpoundedWebhook: makeInitialValue(cad!, DiscordWebhookType.VEHICLE_IMPOUNDED),
    citizenRecordsWebhook: makeInitialValue(cad!, DiscordWebhookType.CITIZEN_RECORD),
  };

  React.useEffect(() => {
    void refreshChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshChannels() {
    const { json } = await execute("/admin/manage/cad-settings/discord/webhooks", {
      method: "GET",
      noToast: !canWarn,
    });

    if (Array.isArray(json)) {
      setChannels(json);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/admin/manage/cad-settings/discord/webhooks", {
      method: "POST",
      data: values,
    });

    if (Array.isArray(json)) {
      setChannels(json);
    }
  }

  return (
    <TabsContent value={SettingsTabs.DiscordWebhooks}>
      <header>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Discord Webhooks</h2>

          <Button onClick={refreshChannels} className="h-fit min-w-fit">
            Refresh Channels
          </Button>
        </div>

        <p className="my-3 text-neutral-700 dark:text-gray-200 max-w-2xl">
          Select a channel for each webhook type. This will create a new Discord webhook and send
          webhooks on the respective event type.
        </p>
      </header>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {() => (
          <Form className="mt-5 space-y-5">
            <WebhookField
              fieldName="call911Webhook"
              channels={channels}
              description="The Discord channel where 911 calls will be sent to."
              label="911 calls channel"
            />

            <WebhookField
              fieldName="statusesWebhook"
              channels={channels}
              description="The Discord channel where unit status updates will be sent to."
              label="Status updates channel"
            />

            <WebhookField
              fieldName="panicButtonWebhook"
              channels={channels}
              description="The Discord channel where panic button triggers will be sent to."
              label="Panic button channel"
            />

            <WebhookField
              fieldName="boloWebhook"
              channels={channels}
              description="The Discord channel where new BOLO's will be sent to."
              label="BOLO's channel"
            />

            <WebhookField
              fieldName="vehicleImpoundedWebhook"
              channels={channels}
              description="The Discord channel where impounded vehicle notifications will be sent to."
              label="Impounded vehicles channel"
            />

            <WebhookField
              fieldName="citizenRecordsWebhook"
              channels={channels}
              description="The Discord channel where new arrest reports, tickets and written warnings will be sent to."
              label="Citizen records channel"
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

function makeInitialValue(cad: cad, type: string) {
  const webhook = cad.miscCadSettings?.webhooks?.find((v) => v.type === type);
  if (!webhook) return { id: null, type, extraMessage: "" };

  return {
    id: webhook.channelId,
    extraMessage: webhook.extraMessage ?? "",
    type,
  };
}

interface FieldProps {
  description: string;
  label: string;
  channels: any[];
  fieldName: string;
}

function WebhookField({ description, label, channels, fieldName }: FieldProps) {
  const { errors, values, handleChange } = useFormikContext<any>();

  return (
    <SettingsFormField
      description={description}
      errorMessage={(errors[fieldName] as any)?.id}
      label={label}
    >
      <Select
        isClearable
        values={channels.map((role) => ({
          value: role.id,
          label: role.name,
        }))}
        value={values[fieldName]?.id}
        name={`${fieldName}.id`}
        onChange={handleChange}
      />

      <FormField optional className="mt-2" label="Extra message">
        <Textarea
          value={values[fieldName]?.extraMessage}
          name={`${fieldName}.extraMessage`}
          onChange={handleChange}
        />
      </FormField>
    </SettingsFormField>
  );
}
