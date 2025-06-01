import { TabsContent } from "@radix-ui/react-tabs";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import { Button, Input, Loader } from "@snailycad/ui";
import { SettingsTabs } from "components/admin/cad-settings/layout";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { cleanValues } from "./other-misc-tab";
import { toastMessage } from "lib/toastMessage";
import type { MiscCadSettings } from "@snailycad/types";

export function LicenseNumbersTab() {
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
    driversLicenseNumberLength: miscSettings.driversLicenseNumberLength ?? 8,
    weaponLicenseNumberLength: miscSettings.weaponLicenseNumberLength ?? 8,
    pilotLicenseNumberLength: miscSettings.pilotLicenseNumberLength ?? 6,
    waterLicenseNumberLength: miscSettings.waterLicenseNumberLength ?? 8,
    fishingLicenseNumberLength: miscSettings.fishingLicenseNumberLength ?? 8,
    huntingLicenseNumberLength: miscSettings.huntingLicenseNumberLength ?? 8,
  };

  return (
    <TabsContent value={SettingsTabs.CitizenLicensePoints}>
      <header className="mb-3">
        <h2 className="font-semibold text-2xl">{t("citizenLicenseNumbers")}</h2>
        <p className="text-neutral-700 dark:text-gray-400">
          {t("citizenLicenseNumbersDescription")}
        </p>
      </header>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, values, handleChange }) => (
          <Form>
            <SettingsFormField
              errorMessage={errors.driversLicenseNumberLength}
              description={t("driversLicenseNumberLengthDescription")}
              label={t("driversLicenseNumberLength")}
              action="short-input"
            >
              <Input
                type="number"
                name="driversLicenseNumberLength"
                value={values.driversLicenseNumberLength}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.weaponLicenseNumberLength}
              description={t("weaponLicenseNumberLengthDescription")}
              label={t("weaponLicenseNumberLength")}
              action="short-input"
            >
              <Input
                type="number"
                name="weaponLicenseNumberLength"
                value={values.weaponLicenseNumberLength}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.pilotLicenseNumberLength}
              description={t("pilotLicenseNumberLengthDescription")}
              label={t("pilotLicenseNumberLength")}
              action="short-input"
            >
              <Input
                type="number"
                name="pilotLicenseNumberLength"
                value={values.pilotLicenseNumberLength}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.waterLicenseNumberLength}
              description={t("waterLicenseNumberLengthDescription")}
              label={t("waterLicenseNumberLength")}
              action="short-input"
            >
              <Input
                type="number"
                name="waterLicenseNumberLength"
                value={values.waterLicenseNumberLength}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.fishingLicenseNumberLength}
              description={t("fishingLicenseNumberLengthDescription")}
              label={t("fishingLicenseNumberLength")}
              action="short-input"
            >
              <Input
                type="number"
                name="fishingLicenseNumberLength"
                value={values.fishingLicenseNumberLength}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.huntingLicenseNumberLength}
              description={t("huntingLicenseNumberLengthDescription")}
              label={t("huntingLicenseNumberLength")}
              action="short-input"
            >
              <Input
                type="number"
                name="huntingLicenseNumberLength"
                value={values.huntingLicenseNumberLength}
                onChange={handleChange}
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
