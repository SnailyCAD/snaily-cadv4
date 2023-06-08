import * as React from "react";
import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";

import { Textarea, Loader, Input, Button, TabsContent } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { JailTimeScale, MiscCadSettings } from "@snailycad/types";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { SettingsFormField } from "components/form/SettingsFormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { Select } from "components/form/Select";
import { toastMessage } from "lib/toastMessage";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { InactivityTimeoutSection } from "./misc-features/inactivity-timeout-section";
import { LicenseNumbersSection } from "./misc-features/license-number-section";
import { TemplateSection } from "./misc-features/template-section";
import { MaxLicensePointsSection } from "./misc-features/max-license-points";

export function MiscFeatures() {
  const [headerId, setHeaderId] = React.useState<(File | string) | null>(null);
  const [bgId, setBgId] = React.useState<(File | string) | null>(null);

  const common = useTranslations("Common");
  const t = useTranslations("MiscSettingsTab");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const { DIVISIONS } = useFeatureEnabled();

  // infinity -> null, "" -> null
  function cleanValues(values: typeof INITIAL_VALUES) {
    const newValues: Record<string, any> = {};
    const excluded = ["heightPrefix", "weightPrefix", "callsignTemplate"];
    const toBeRemoved = ["authScreenHeaderImageId", "authScreenBgImageId"];

    for (const key in values) {
      const value = values[key as keyof typeof INITIAL_VALUES];

      if (toBeRemoved.includes(key)) {
        newValues[key] = undefined;
        continue;
      }

      if (excluded.includes(key)) {
        newValues[key] = value;
        continue;
      }

      if (typeof value === "string" && value.trim() === "") {
        newValues[key] = null;
      } else if (typeof value === "number" && value === Infinity) {
        newValues[key] = null;
      } else {
        newValues[key] = values[key as keyof typeof INITIAL_VALUES];
      }
    }

    return newValues;
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const { json } = await execute<PutCADMiscSettingsData>({
      path: "/admin/manage/cad-settings/misc",
      method: "PUT",
      data: cleanValues(values),
    });

    const fd = new FormData();
    const header = validateFile(headerId, helpers);
    const background = validateFile(bgId, helpers);

    if (header || background) {
      let imgCount = 0;
      if (header && typeof header !== "string") {
        imgCount += 1;
        fd.append("files", header, "authScreenHeaderImageId");
      }

      if (background && typeof background !== "string") {
        imgCount += 1;
        fd.append("files", background, "authScreenBgImageId");
      }

      if (imgCount > 0) {
        await execute({
          path: "/admin/manage/cad-settings/image/auth",
          method: "POST",
          data: fd,
          headers: {
            "content-type": "multipart/form-data",
          },
        });
      }
    }

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
  const INITIAL_VALUES = {
    cadOGDescription: miscSettings.cadOGDescription ?? "",
    weightPrefix: miscSettings.weightPrefix,
    heightPrefix: miscSettings.heightPrefix,
    maxBusinessesPerCitizen: miscSettings.maxBusinessesPerCitizen ?? Infinity,
    maxCitizensPerUser: miscSettings.maxCitizensPerUser ?? Infinity,
    maxPlateLength: miscSettings.maxPlateLength,
    maxDivisionsPerOfficer: miscSettings.maxDivisionsPerOfficer ?? Infinity,
    maxDepartmentsEachPerUser: miscSettings.maxDepartmentsEachPerUser ?? Infinity,
    maxAssignmentsToIncidents: miscSettings.maxAssignmentsToIncidents ?? Infinity,
    maxAssignmentsToCalls: miscSettings.maxAssignmentsToCalls ?? Infinity,
    maxOfficersPerUser: miscSettings.maxOfficersPerUser ?? Infinity,
    callsignTemplate: miscSettings.callsignTemplate ?? "",
    caseNumberTemplate: miscSettings.caseNumberTemplate ?? "",
    pairedUnitTemplate: miscSettings.pairedUnitTemplate ?? "",
    liveMapURL: miscSettings.liveMapURL ?? "",
    jailTimeScaling: miscSettings.jailTimeScale ?? null,

    call911InactivityTimeout: miscSettings.call911InactivityTimeout ?? "",
    incidentInactivityTimeout: miscSettings.incidentInactivityTimeout ?? "",
    unitInactivityTimeout: miscSettings.unitInactivityTimeout ?? "",
    activeWarrantsInactivityTimeout: miscSettings.activeWarrantsInactivityTimeout ?? "",
    boloInactivityTimeout: miscSettings.boloInactivityTimeout ?? "",
    activeDispatchersInactivityTimeout: miscSettings.activeDispatchersInactivityTimeout ?? "",

    driversLicenseNumberLength: miscSettings.driversLicenseNumberLength ?? 8,
    driversLicenseTemplate: miscSettings.driversLicenseTemplate ?? "",

    weaponLicenseNumberLength: miscSettings.weaponLicenseNumberLength ?? 8,
    pilotLicenseTemplate: miscSettings.pilotLicenseTemplate ?? "",

    pilotLicenseNumberLength: miscSettings.pilotLicenseNumberLength ?? 6,
    weaponLicenseTemplate: miscSettings.weaponLicenseTemplate ?? "",

    waterLicenseNumberLength: miscSettings.waterLicenseNumberLength ?? 8,
    waterLicenseTemplate: miscSettings.waterLicenseTemplate ?? "",

    driversLicenseMaxPoints: miscSettings.driversLicenseMaxPoints ?? 12,
    pilotLicenseMaxPoints: miscSettings.pilotLicenseMaxPoints ?? 12,
    weaponLicenseMaxPoints: miscSettings.weaponLicenseMaxPoints ?? 12,
    waterLicenseMaxPoints: miscSettings.waterLicenseMaxPoints ?? 12,
  };

  return (
    <TabsContent value={SettingsTabs.MiscSettings} className="mt-3">
      <h2 className="text-2xl font-semibold">{t("miscSettings")}</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form className="mt-3 space-y-5">
            <section>
              <h3 className="font-semibold text-xl mb-3">{t("cadRelated")}</h3>

              <ImageSelectInput
                label={t("authScreenHeaderImage")}
                image={headerId}
                setImage={setHeaderId}
                valueKey="authScreenHeaderImageId"
              />

              <ImageSelectInput
                label={t("authScreenBackgroundImage")}
                image={bgId}
                setImage={setBgId}
                valueKey="authScreenBgImageId"
              />

              <SettingsFormField
                label={t("cadOpenGraphDescription")}
                description={t("cadOpenGraphDescriptionInfo")}
                errorMessage={errors.cadOGDescription}
              >
                <Textarea
                  name="cadOGDescription"
                  value={values.cadOGDescription}
                  onChange={handleChange}
                />
              </SettingsFormField>
            </section>

            <InactivityTimeoutSection />
            <LicenseNumbersSection />
            <MaxLicensePointsSection />
            <TemplateSection />

            <section>
              <h3 className="font-semibold text-xl mb-3">{t("other")}</h3>

              <SettingsFormField
                action="short-input"
                label={t("weightPrefix")}
                description={t("weightPrefixDescription")}
                errorMessage={errors.weightPrefix}
              >
                <Input name="weightPrefix" value={values.weightPrefix} onChange={handleChange} />
              </SettingsFormField>

              <SettingsFormField
                action="short-input"
                label={t("heightPrefix")}
                description={t("heightPrefixDescription")}
                errorMessage={errors.heightPrefix}
              >
                <Input name="heightPrefix" value={values.heightPrefix} onChange={handleChange} />
              </SettingsFormField>

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

              <SettingsFormField
                description={t("jailTimeScalingDescription")}
                errorMessage={errors.jailTimeScaling}
                label={t("jailTimeScaling")}
              >
                <Select
                  values={[
                    { label: t("hours"), value: JailTimeScale.HOURS },
                    { label: t("minutes"), value: JailTimeScale.MINUTES },
                    { label: t("seconds"), value: JailTimeScale.SECONDS },
                  ]}
                  name="jailTimeScaling"
                  value={values.jailTimeScaling}
                  onChange={handleChange}
                  isClearable
                />
              </SettingsFormField>
            </section>

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
