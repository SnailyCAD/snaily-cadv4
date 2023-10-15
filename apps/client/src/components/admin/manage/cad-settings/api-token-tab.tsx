import * as React from "react";
import { Button, Loader, SwitchField, TextField } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { SettingsFormField } from "components/form/SettingsFormField";
import { toastMessage } from "lib/toastMessage";
import type { DeleteCADApiTokenData, PutCADApiTokenData } from "@snailycad/types/api";
import { getAPIUrl } from "@snailycad/utils/api-url";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

export function ApiTokenTab() {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const tAdmin = useTranslations("Management");
  const t = useTranslations("ApiTokenTab");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const { json } = await execute<PutCADApiTokenData>({
      path: "/admin/manage/cad-settings/api-token",
      method: "PUT",
      data: values,
    });

    setCad({ ...cad, apiTokenId: json?.id ?? null, apiToken: json });
    toastMessage({
      icon: "success",
      title: common("success"),
      message: common("savedSettingsSuccess"),
    });

    if (json) {
      helpers.setFieldValue("token", json.token);
    }
  }

  async function handleRegenerate(
    setFieldValue: FormikHelpers<typeof INITIAL_VALUES>["setFieldValue"],
  ) {
    const { json } = await execute<DeleteCADApiTokenData>({
      path: "/admin/manage/cad-settings/api-token",
      method: "DELETE",
    });

    if (json.token) {
      setFieldValue("token", json.token);
    }
  }

  const INITIAL_VALUES = {
    enabled: cad?.apiToken?.enabled ?? false,
    token: cad?.apiToken?.token ?? "",
  };

  const apiURL = getAPIUrl();
  const discordCommand = `/config set api-url: ${apiURL} api-token: ${cad?.apiToken?.token ?? ""}`;

  return (
    <TabsContent aria-label={t("apiToken")} value={SettingsTabs.APIToken}>
      <h2 className="mt-2 text-2xl font-semibold">{t("publicAPIAccess")}</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values }) => (
          <Form className="mt-3 space-y-5">
            <SettingsFormField
              action="checkbox"
              description={t.rich("readMorePublicAPI", {
                a: (children) => (
                  <a
                    rel="noreferrer"
                    target="_blank"
                    className="text-blue-600 underline"
                    href="https://docs.snailycad.org/docs/developer/public-api"
                  >
                    {children}
                  </a>
                ),
              })}
              label={common("enabled")}
            >
              <SwitchField
                aria-label={common("enabled")}
                isSelected={values.enabled}
                onChange={(isSelected) => setFieldValue("enabled", isSelected)}
                name="enabled"
              />
            </SettingsFormField>

            <SettingsFormField
              description={t.rich("tokenDescription", {
                a: (children) => (
                  <a
                    rel="noreferrer"
                    target="_blank"
                    className="text-blue-600 underline"
                    href="https://docs.snailycad.org/docs/developer/public-api"
                  >
                    {children}
                  </a>
                ),
              })}
              label="Token"
            >
              <TextField
                label="Token"
                type="password"
                inputElementType="input"
                onFocus={(event) => (event.target as HTMLInputElement).select()}
                isReadOnly
                value={values.token}
                isDisabled={!values.enabled}
              />
            </SettingsFormField>

            <SettingsFormField
              description={t.rich("discordBotCommandDescription", {
                a: (children) => (
                  <a
                    rel="noreferrer"
                    target="_blank"
                    className="text-blue-600 underline"
                    href="https://docs.snailycad.org/docs/discord-integration/discord-bot"
                  >
                    {children}
                  </a>
                ),
              })}
              label={t("discordBotCommand")}
            >
              <TextField
                label={t("discordBotCommand")}
                type="password"
                inputElementType="input"
                onFocus={(event) => (event.target as HTMLInputElement).select()}
                isReadOnly
                value={discordCommand}
                isDisabled={!values.enabled}
              />
            </SettingsFormField>

            <div className="flex justify-end">
              {cad?.apiTokenId ? (
                <Button
                  onPress={() => handleRegenerate(setFieldValue)}
                  variant="danger"
                  className="flex items-center mr-2"
                  type="button"
                  disabled={state === "loading"}
                >
                  {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
                  {tAdmin("reGenerateToken")}
                </Button>
              ) : null}
              <Button className="flex items-center" type="submit" disabled={state === "loading"}>
                {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
                {common("save")}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}
