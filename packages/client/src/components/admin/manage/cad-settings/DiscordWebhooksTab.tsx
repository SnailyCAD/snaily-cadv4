import * as React from "react";
import { Button } from "components/Button";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { TabsContent } from "components/shared/TabList";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { SettingsFormField } from "components/form/SettingsFormField";

export function DiscordWebhooksTab() {
  const [channels, setChannels] = React.useState<any[]>([]);
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const { cad } = useAuth();

  const INITIAL_VALUES = {
    call911WebhookId: cad?.miscCadSettings?.call911WebhookId ?? null,
    statusesWebhookId: cad?.miscCadSettings?.statusesWebhookId ?? null,
  };

  React.useEffect(() => {
    refreshChannels();
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
        {({ handleChange, handleSubmit, errors, values }) => (
          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
            <SettingsFormField
              action="input"
              // eslint-disable-next-line quotes
              description={'The Discord role that represents the "ADMIN" rank'}
              errorMessage={errors.call911WebhookId}
              label="911 calls channel"
            >
              <Select
                isClearable
                values={channels.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.call911WebhookId}
                name="call911WebhookId"
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              description="The Discord role that represents the LEO permission"
              errorMessage={errors.statusesWebhookId}
              label="Status updates channel"
            >
              <Select
                isClearable
                values={channels.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                value={values.statusesWebhookId}
                name=".statusesWebhookId"
                onChange={handleChange}
              />
            </SettingsFormField>

            <Button className="flex items-center" type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </TabsContent>
  );
}
