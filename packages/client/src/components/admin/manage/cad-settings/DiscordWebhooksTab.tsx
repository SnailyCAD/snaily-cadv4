import * as React from "react";
import { Button } from "components/Button";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { TabsContent } from "components/shared/TabList";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { SettingsFormField } from "components/form/SettingsFormField";
import { cad, DiscordWebhookType } from "@snailycad/types";
import { Textarea } from "components/form/Textarea";
import { FormField } from "components/form/FormField";

export function DiscordWebhooksTab() {
  const [channels, setChannels] = React.useState<any[]>([]);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { cad } = useAuth();

  const INITIAL_VALUES = {
    call911Webhook: makeInitialValue(cad!, DiscordWebhookType.CALL_911),
    statusesWebhook: makeInitialValue(cad!, DiscordWebhookType.UNIT_STATUS),
    panicButtonWebhook: makeInitialValue(cad!, DiscordWebhookType.PANIC_BUTTON),
    boloWebhook: makeInitialValue(cad!, DiscordWebhookType.BOLO),
  };

  React.useEffect(() => {
    void refreshChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshChannels() {
    const { json } = await execute("/admin/manage/cad-settings/discord/webhooks", {
      method: "GET",
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
    <TabsContent value="DISCORD_WEBHOOKS_TAB">
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
        {({ handleChange, errors, values }) => (
          <Form className="mt-5 space-y-5">
            <SettingsFormField
              action="input"
              description="The Discord channel where 911 calls will be sent to."
              errorMessage={errors.call911Webhook?.id}
              label="911 calls channel"
            >
              <Select
                isClearable
                values={channels.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.call911Webhook.id}
                name="call911Webhook.id"
                onChange={handleChange}
              />

              <FormField optional className="mt-2" label="Extra message">
                <Textarea
                  value={values.call911Webhook.extraMessage}
                  name="call911Webhook.extraMessage"
                  onChange={handleChange}
                />
              </FormField>
            </SettingsFormField>

            <SettingsFormField
              description="The Discord channel where unit status updates will be sent to."
              errorMessage={errors.statusesWebhook?.id}
              label="Status updates channel"
            >
              <Select
                isClearable
                values={channels.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.statusesWebhook.id}
                name="statusesWebhook.id"
                onChange={handleChange}
              />

              <FormField optional className="mt-2" label="Extra message">
                <Textarea
                  value={values.statusesWebhook.extraMessage}
                  name="statusesWebhook.extraMessage"
                  onChange={handleChange}
                />
              </FormField>
            </SettingsFormField>

            <SettingsFormField
              description="The Discord channel where panic button triggers will be sent to."
              errorMessage={errors.panicButtonWebhook?.id}
              label="Panic button channel"
            >
              <Select
                isClearable
                values={channels.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.panicButtonWebhook.id}
                name="panicButtonWebhook.id"
                onChange={handleChange}
              />

              <FormField optional className="mt-2" label="Extra message">
                <Textarea
                  value={values.panicButtonWebhook.extraMessage}
                  name="panicButtonWebhook.extraMessage"
                  onChange={handleChange}
                />
              </FormField>
            </SettingsFormField>

            <SettingsFormField
              description="The Discord channel where new BOLO's will be sent to."
              errorMessage={errors.boloWebhook?.id}
              label="BOLO's channel"
            >
              <Select
                isClearable
                values={channels.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.boloWebhook.id}
                name="boloWebhook.id"
                onChange={handleChange}
              />

              <FormField optional className="mt-2" label="Extra message">
                <Textarea
                  value={values.boloWebhook.extraMessage}
                  name="boloWebhook.extraMessage"
                  onChange={handleChange}
                />
              </FormField>
            </SettingsFormField>

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
