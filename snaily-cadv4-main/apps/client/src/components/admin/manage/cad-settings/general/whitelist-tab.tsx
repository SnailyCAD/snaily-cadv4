import { TabsContent } from "@radix-ui/react-tabs";
import type { PutCADSettingsData } from "@snailycad/types/api";
import { Button, Loader, SwitchField } from "@snailycad/ui";
import { SettingsTabs } from "components/admin/cad-settings/layout";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import { toastMessage } from "lib/toastMessage";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

export function WhitelistTab() {
  const t = useTranslations("CadSettings");
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();
  const { state, execute } = useFetch();

  async function handleSubmit(data: typeof initialValues) {
    if (!cad) return;

    const { json } = await execute<PutCADSettingsData>({
      path: "/admin/manage/cad-settings",
      method: "PUT",
      data: { ...cad, ...data },
    });

    if (json.id) {
      setCad({ ...cad, ...json });
      toastMessage({
        icon: "success",
        title: common("success"),
        message: common("savedSettingsSuccess"),
      });
    }
  }

  if (!cad) {
    return null;
  }

  const initialValues = {
    towWhitelisted: cad.towWhitelisted ?? false,
    taxiWhitelisted: cad.taxiWhitelisted ?? false,
    whitelisted: cad.whitelisted ?? false,
    businessWhitelisted: cad.businessWhitelisted ?? false,
  };

  return (
    <TabsContent value={SettingsTabs.WhitelistSettings}>
      <h2 className="font-semibold text-2xl mb-3">{t("whitelisting")}</h2>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, values, setFieldValue }) => (
          <Form>
            <SettingsFormField
              errorMessage={errors.whitelisted}
              action="checkbox"
              label={t("cadWhitelist")}
              description={t("cadWhitelistDescription")}
            >
              <SwitchField
                aria-label={t("cadWhitelist")}
                isSelected={values.whitelisted}
                onChange={(isSelected) => setFieldValue("whitelisted", isSelected)}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.towWhitelisted}
              action="checkbox"
              label={t("towWhitelist")}
              description={t("towWhitelistDescription")}
            >
              <SwitchField
                aria-label={t("towWhitelist")}
                isSelected={values.towWhitelisted}
                onChange={(isSelected) => setFieldValue("towWhitelisted", isSelected)}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.taxiWhitelisted}
              action="checkbox"
              label={t("taxiWhitelist")}
              description={t("taxiWhitelistDescription")}
            >
              <SwitchField
                aria-label={t("taxiWhitelist")}
                isSelected={values.taxiWhitelisted}
                onChange={(isSelected) => setFieldValue("taxiWhitelisted", isSelected)}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.businessWhitelisted}
              action="checkbox"
              label={t("businessWhitelist")}
              description={t("businessWhitelistDescription")}
            >
              <SwitchField
                aria-label={t("businessWhitelist")}
                isSelected={values.businessWhitelisted}
                onChange={(isSelected) => setFieldValue("businessWhitelisted", isSelected)}
              />
            </SettingsFormField>

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
