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

export const CALLSIGN_TEMPLATE_VARIABLES = (
  <span key="CALLSIGN_TEMPLATE_VARIABLES">
    <code>{"{department}"}</code>,<code>{"{division}"}</code>, <code>{"{callsign1}"}</code>,{" "}
    <code>{"{callsign2}"}</code>
  </span>
);

const CASE_NUMBER_TEMPLATE_VARIABLES = (
  <span key="CASE_NUMBER_TEMPLATE_VARIABLES">
    <code>{"{id}"}</code>, <code>{"{department}"}</code>, <code>{"{year}"}</code>,{" "}
    <code>{"{month}"}</code>, <code>{"{day}"}</code>
  </span>
);

const LICENSE_NUMBER_TEMPLATE_VARIABLES = (
  <span key="LICENSE_NUMBER_TEMPLATE_VARIABLES">
    <code>{"{letter/<length>}"}</code>, <code>{"{number/<length>}"}</code>
  </span>
);

const licenseNumberTypes = [
  "driversLicenseTemplate",
  "pilotLicenseTemplate",
  "weaponLicenseTemplate",
  "waterLicenseTemplate",
  "fishingLicenseTemplate",
  "huntingLicenseTemplate",
] as const;

export function TemplateTab() {
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
    callsignTemplate: miscSettings.callsignTemplate ?? "",
    caseNumberTemplate: miscSettings.caseNumberTemplate ?? "",
    pairedUnitTemplate: miscSettings.pairedUnitTemplate ?? "",
    driversLicenseTemplate: miscSettings.driversLicenseTemplate ?? "",
    pilotLicenseTemplate: miscSettings.pilotLicenseTemplate ?? "",
    weaponLicenseTemplate: miscSettings.weaponLicenseTemplate ?? "",
    waterLicenseTemplate: miscSettings.waterLicenseTemplate ?? "",
    fishingLicenseTemplate: miscSettings.fishingLicenseTemplate ?? "",
    huntingLicenseTemplate: miscSettings.huntingLicenseTemplate ?? "",
  };

  return (
    <TabsContent value={SettingsTabs.Templates}>
      <h3 className="font-semibold text-2xl mb-3">{t("templateSection")}</h3>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, values, handleChange }) => (
          <Form>
            <SettingsFormField
              description={t.rich("callsignTemplateInfo", {
                // @ts-expect-error this is a valid element
                variables: CALLSIGN_TEMPLATE_VARIABLES,
              })}
              label={t("callsignTemplate")}
              errorMessage={errors.callsignTemplate}
            >
              <Input
                name="callsignTemplate"
                value={values.callsignTemplate}
                onChange={handleChange}
              />
            </SettingsFormField>
            <SettingsFormField
              errorMessage={errors.caseNumberTemplate}
              description={t.rich("caseNumberTemplateInfo", {
                // @ts-expect-error this is a valid element
                variables: CASE_NUMBER_TEMPLATE_VARIABLES,
              })}
              label={t("caseNumberTemplate")}
            >
              <Input
                name="caseNumberTemplate"
                value={values.caseNumberTemplate}
                onChange={handleChange}
              />
            </SettingsFormField>
            <SettingsFormField
              errorMessage={errors.pairedUnitTemplate}
              description={t.rich("pairedUnitTemplateInfo", {
                // @ts-expect-error this is a valid element
                variables: CALLSIGN_TEMPLATE_VARIABLES,
              })}
              label={t("pairedUnitTemplate")}
            >
              <Input
                name="pairedUnitTemplate"
                value={values.pairedUnitTemplate}
                onChange={handleChange}
              />
            </SettingsFormField>
            {licenseNumberTypes.map((type) => (
              <SettingsFormField
                key={type}
                errorMessage={errors[type]}
                description={t.rich(`${type}Info`, {
                  // @ts-expect-error this is a valid element
                  variables: LICENSE_NUMBER_TEMPLATE_VARIABLES,
                })}
                label={t(type)}
              >
                <Input
                  placeholder="L{number/3}-{number/6}"
                  name={type}
                  value={values[type]}
                  onChange={handleChange}
                />
              </SettingsFormField>
            ))}

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
