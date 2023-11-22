import { TabsContent } from "@radix-ui/react-tabs";
import type { MiscCadSettings } from "@snailycad/types";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import { Button, Input, Loader } from "@snailycad/ui";
import { SettingsTabs } from "components/admin/cad-settings/layout";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import { toastMessage } from "lib/toastMessage";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { cleanValues } from "./other-misc-tab";

export function InactivityTimeoutTab() {
  const t = useTranslations("MiscSettingsTab");
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();
  const { state, execute } = useFetch();

  async function handleSubmit(data: typeof initialValues) {
    if (!cad) return;

    const { json } = await execute<PutCADMiscSettingsData>({
      path: "/admin/manage/cad-settings/misc",
      method: "PUT",
      data: { ...cad.miscCadSettings, ...cleanValues(data) },
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

  const miscSettings = cad?.miscCadSettings ?? ({} as MiscCadSettings);

  const initialValues = {
    call911InactivityTimeout: miscSettings.call911InactivityTimeout ?? "",
    incidentInactivityTimeout: miscSettings.incidentInactivityTimeout ?? "",
    unitInactivityTimeout: miscSettings.unitInactivityTimeout ?? "",
    activeWarrantsInactivityTimeout: miscSettings.activeWarrantsInactivityTimeout ?? "",
    boloInactivityTimeout: miscSettings.boloInactivityTimeout ?? "",
    activeDispatchersInactivityTimeout: miscSettings.activeDispatchersInactivityTimeout ?? "",
  };

  return (
    <TabsContent value={SettingsTabs.InactivityTimeouts}>
      <h2 className="font-semibold text-2xl mb-3">{t("inactivityTimeouts")}</h2>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, values, handleChange }) => (
          <Form>
            <SettingsFormField
              optional
              action="short-input"
              label={t("911CallInactivityTimeout")}
              description={t("911CallInactivityTimeoutDescription")}
              errorMessage={errors.call911InactivityTimeout}
            >
              <Input
                type="number"
                name="call911InactivityTimeout"
                value={values.call911InactivityTimeout}
                onChange={handleChange}
                placeholder="120"
                min={10}
              />
            </SettingsFormField>

            <SettingsFormField
              optional
              action="short-input"
              label={t("incidentInactivityTimeout")}
              description={t("incidentInactivityTimeoutDescription")}
              errorMessage={errors.incidentInactivityTimeout}
            >
              <Input
                type="number"
                name="incidentInactivityTimeout"
                value={values.incidentInactivityTimeout}
                onChange={handleChange}
                placeholder="120"
                min={10}
              />
            </SettingsFormField>

            <SettingsFormField
              optional
              action="short-input"
              label={t("unitInactivityTimeout")}
              description={t("unitInactivityTimeoutDescription")}
              errorMessage={errors.unitInactivityTimeout}
            >
              <Input
                type="number"
                name="unitInactivityTimeout"
                value={values.unitInactivityTimeout}
                onChange={handleChange}
                placeholder="120"
                min={10}
              />
            </SettingsFormField>

            <SettingsFormField
              optional
              action="short-input"
              label={t("activeDispatcherInactivityTimeout")}
              description={t("activeDispatcherInactivityTimeoutDescription")}
              errorMessage={errors.activeDispatchersInactivityTimeout}
            >
              <Input
                type="number"
                name="activeDispatchersInactivityTimeout"
                value={values.activeDispatchersInactivityTimeout}
                onChange={handleChange}
                placeholder="120"
                min={10}
              />
            </SettingsFormField>

            <SettingsFormField
              optional
              action="short-input"
              label={t("boloInactivityTimeout")}
              description={t("boloInactivityTimeoutDescription")}
              errorMessage={errors.boloInactivityTimeout}
            >
              <Input
                type="number"
                name="boloInactivityTimeout"
                value={values.boloInactivityTimeout}
                onChange={handleChange}
                placeholder="120"
                min={10}
              />
            </SettingsFormField>

            <SettingsFormField
              optional
              action="short-input"
              label={t("activeWarrantsInactivityTimeout")}
              description={t("activeWarrantsInactivityTimeoutDescription")}
              errorMessage={errors.activeWarrantsInactivityTimeout}
            >
              <Input
                type="number"
                name="activeWarrantsInactivityTimeout"
                value={values.activeWarrantsInactivityTimeout}
                onChange={handleChange}
                placeholder="120"
                min={10}
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
