import type { MiscCadSettings } from "@snailycad/types";
import { Button, Input, Loader } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { toastMessage } from "lib/toastMessage";
import { useTranslations } from "use-intl";
import { cleanValues } from "./other-misc-tab";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

export function MaxLicensePointsSection() {
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
    driversLicenseMaxPoints: miscSettings.driversLicenseMaxPoints ?? 12,
    pilotLicenseMaxPoints: miscSettings.pilotLicenseMaxPoints ?? 12,
    weaponLicenseMaxPoints: miscSettings.weaponLicenseMaxPoints ?? 12,
    waterLicenseMaxPoints: miscSettings.waterLicenseMaxPoints ?? 12,
    fishingLicenseMaxPoints: miscSettings.fishingLicenseMaxPoints ?? 12,
    huntingLicenseMaxPoints: miscSettings.huntingLicenseMaxPoints ?? 12,
  };

  return (
    <TabsContent value={SettingsTabs.MaxLicensePoints}>
      <header className="mb-3">
        <h3 className="font-semibold text-2xl">{t("maxLicensePoints")}</h3>
        <p className="text-neutral-700 dark:text-gray-400">{t("maxLicensePointsDescription")}</p>
      </header>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, values, handleChange }) => (
          <Form>
            <SettingsFormField
              errorMessage={errors.driversLicenseMaxPoints}
              label={t("maxDriverLicensePoints")}
              description={t("maxDriverLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="driversLicenseMaxPoints"
                value={values.driversLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.pilotLicenseMaxPoints}
              label={t("maxPilotLicensePoints")}
              description={t("maxPilotLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="pilotLicenseMaxPoints"
                value={values.pilotLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.weaponLicenseMaxPoints}
              label={t("maxWeaponLicensePoints")}
              description={t("maxWeaponLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="weaponLicenseMaxPoints"
                value={values.weaponLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.waterLicenseMaxPoints}
              label={t("maxWaterLicensePoints")}
              description={t("maxWaterLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="waterLicenseMaxPoints"
                value={values.waterLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.weaponLicenseMaxPoints}
              label={t("maxWeaponLicensePoints")}
              description={t("maxWeaponLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="weaponLicenseMaxPoints"
                value={values.weaponLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.waterLicenseMaxPoints}
              label={t("maxWaterLicensePoints")}
              description={t("maxWaterLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="waterLicenseMaxPoints"
                value={values.waterLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.fishingLicenseMaxPoints}
              label={t("maxFishingLicensePoints")}
              description={t("maxFishingLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="fishingLicenseMaxPoints"
                value={values.fishingLicenseMaxPoints}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.huntingLicenseMaxPoints}
              label={t("maxHuntingLicensePoints")}
              description={t("maxHuntingLicensePointsDescription")}
              action="short-input"
            >
              <Input
                type="number"
                name="huntingLicenseMaxPoints"
                value={values.huntingLicenseMaxPoints}
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
