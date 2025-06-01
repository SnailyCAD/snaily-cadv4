import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import { Button, Input, Loader } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { cleanValues } from "./other-misc-tab";
import { toastMessage } from "lib/toastMessage";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";
import type { MiscCadSettings } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

export function LimitsTab() {
  const t = useTranslations("MiscSettingsTab");
  const common = useTranslations("Common");
  const { cad, setCad } = useAuth();
  const { state, execute } = useFetch();
  const { DIVISIONS } = useFeatureEnabled();

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
    maxBusinessesPerCitizen: miscSettings.maxBusinessesPerCitizen ?? Infinity,
    maxCitizensPerUser: miscSettings.maxCitizensPerUser ?? Infinity,
    maxPlateLength: miscSettings.maxPlateLength,
    maxDivisionsPerOfficer: miscSettings.maxDivisionsPerOfficer ?? Infinity,
    maxDepartmentsEachPerUser: miscSettings.maxDepartmentsEachPerUser ?? Infinity,
    maxAssignmentsToIncidents: miscSettings.maxAssignmentsToIncidents ?? Infinity,
    maxAssignmentsToCalls: miscSettings.maxAssignmentsToCalls ?? Infinity,
    maxOfficersPerUser: miscSettings.maxOfficersPerUser ?? Infinity,
  };

  return (
    <TabsContent value={SettingsTabs.Limits}>
      <h3 className="font-semibold text-2xl mb-3">{t("limits")}</h3>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, values, handleChange }) => (
          <Form>
            <SettingsFormField
              action="short-input"
              label={t("maxBusinessesPerCitizen")}
              description={t("maxBusinessesPerCitizenDescription")}
              errorMessage={errors.maxBusinessesPerCitizen}
            >
              <Input
                name="maxBusinessesPerCitizen"
                type="number"
                value={values.maxBusinessesPerCitizen}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              label={t("maxCitizensPerUser")}
              description={t("maxCitizensPerUserDescription")}
              errorMessage={errors.maxCitizensPerUser}
            >
              <Input
                name="maxCitizensPerUser"
                type="number"
                value={values.maxCitizensPerUser}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              label={t("maxDepartmentsPerUnitPerUser")}
              description={t("maxDepartmentsPerUnitPerUserDescription")}
              errorMessage={errors.maxDepartmentsEachPerUser}
            >
              <Input
                name="maxDepartmentsEachPerUser"
                type="number"
                value={values.maxDepartmentsEachPerUser}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            {DIVISIONS ? (
              <SettingsFormField
                label={t("maxDivisionsPerOfficer")}
                action="short-input"
                description={t("maxDivisionsPerOfficerDescription")}
                errorMessage={errors.maxDivisionsPerOfficer}
              >
                <Input
                  name="maxDivisionsPerOfficer"
                  type="number"
                  value={values.maxDivisionsPerOfficer}
                  onChange={handleChange}
                  min={1}
                />
              </SettingsFormField>
            ) : null}

            <SettingsFormField
              label={t("maxAssignmentsToIncidentsPerOfficer")}
              action="short-input"
              description={t("maxAssignmentsToIncidentsPerOfficerDescription")}
              errorMessage={errors.maxAssignmentsToIncidents}
            >
              <Input
                name="maxAssignmentsToIncidents"
                type="number"
                value={values.maxAssignmentsToIncidents}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              label={t("maxAssignmentsToCallsPerUnit")}
              action="short-input"
              description={t("maxAssignmentsToCallsPerUnitDescription")}
              errorMessage={errors.maxAssignmentsToCalls}
            >
              <Input
                name="maxAssignmentsToCalls"
                type="number"
                value={values.maxAssignmentsToCalls}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              label={t("maxOfficersPerUser")}
              action="short-input"
              description={t("maxOfficersPerUserDescription")}
              errorMessage={errors.maxOfficersPerUser}
            >
              <Input
                name="maxOfficersPerUser"
                type="number"
                value={values.maxOfficersPerUser}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              description={t("maxPlateLengthDescription")}
              errorMessage={errors.maxPlateLength}
              label={t("maxPlateLength")}
            >
              <Input
                name="maxPlateLength"
                type="number"
                value={values.maxPlateLength}
                onChange={handleChange}
                min={1}
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
