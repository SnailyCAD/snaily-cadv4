import type * as React from "react";
import { TabsContent } from "components/shared/TabList";
import { PasswordInput } from "components/form/inputs/Input";
import { Toggle } from "components/form/Toggle";
import { Button, Loader } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { SettingsFormField } from "components/form/SettingsFormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { DeleteCADApiTokenData, PutCADApiTokenData } from "@snailycad/types/api";

export function ApiTokenTab() {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const t = useTranslations("Management");

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

  function handleClick(e: React.MouseEvent<HTMLInputElement>) {
    const t = e.target as HTMLInputElement;
    t.select();
  }

  const INITIAL_VALUES = {
    enabled: cad?.apiToken?.enabled ?? false,
    token: cad?.apiToken?.token ?? "",
  };

  return (
    <TabsContent aria-label="API Token" value={SettingsTabs.APIToken}>
      <h2 className="mt-2 text-2xl font-semibold">Public API access</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, values }) => (
          <Form className="mt-3 space-y-5">
            <SettingsFormField
              description="This is the token used to communicate to SnailyCAD via the API."
              label="Token"
            >
              <PasswordInput onClick={handleClick} readOnly value={values.token} />
            </SettingsFormField>

            <SettingsFormField
              action="checkbox"
              description={
                <>
                  Read more info about{" "}
                  <a
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-600 underline"
                    href="https://cad-docs.caspertheghost.me/docs/developer/public-api"
                  >
                    Public API Access here
                  </a>
                </>
              }
              label={common("enabled")}
            >
              <Toggle value={values.enabled} onCheckedChange={handleChange} name="enabled" />
            </SettingsFormField>

            <div className="flex">
              {cad?.apiTokenId ? (
                <Button
                  onPress={() => handleRegenerate(setFieldValue)}
                  variant="danger"
                  className="flex items-center mr-2"
                  type="button"
                  disabled={state === "loading"}
                >
                  {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
                  {t("reGenerateToken")}
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
