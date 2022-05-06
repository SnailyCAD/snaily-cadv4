import * as React from "react";
import { Form, Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";

import { Button } from "components/Button";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Input } from "components/form/inputs/Input";
import type { MiscCadSettings } from "@snailycad/types";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { SettingsFormField } from "components/form/SettingsFormField";

export function MiscFeatures() {
  const [headerId, setHeaderId] = React.useState<(File | string) | null>(null);
  const [bgId, setBgId] = React.useState<(File | string) | null>(null);

  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();

  // infinity -> null, "" -> null
  function cleanValues(values: typeof INITIAL_VALUES) {
    const newValues: Record<string, any> = {};
    const excluded = ["heightPrefix", "weightPrefix", "callsignTemplate"];

    for (const key in values) {
      const value = values[key as keyof typeof INITIAL_VALUES];

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
    const { json } = await execute("/admin/manage/cad-settings/misc", {
      method: "PUT",
      data: cleanValues(values),
    });

    const fd = new FormData();
    const header = validateFile(headerId, helpers);
    const background = validateFile(bgId, helpers);

    if (header || background) {
      let imgCount = 0;
      if (header && typeof header === "object") {
        imgCount += 1;
        fd.set("authScreenHeaderImageId", header, header.name);
      }

      if (background && typeof background === "object") {
        imgCount += 1;
        fd.set("authScreenBgImageId", background, background.name);
      }

      if (imgCount > 0) {
        await execute("/admin/manage/cad-settings/image/auth", {
          method: "POST",
          data: fd,
        });
      }
    }

    if (json.id) {
      setCad({ ...cad, ...json });
    }
  }

  const miscSettings = cad?.miscCadSettings ?? ({} as MiscCadSettings);
  const INITIAL_VALUES = {
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
    pairedUnitTemplate: miscSettings.pairedUnitTemplate ?? "",
    liveMapURL: miscSettings.liveMapURL ?? "",
    inactivityTimeout: miscSettings.inactivityTimeout ?? "",
  };

  return (
    <div className="mt-3">
      <h2 className="text-2xl font-semibold">Misc. Settings</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form className="mt-3 space-y-5">
            <ImageSelectInput
              label="Auth screen header image"
              image={headerId}
              setImage={setHeaderId}
              valueKey="authScreenHeaderImageId"
            />

            <ImageSelectInput
              label="Auth screen background image"
              image={bgId}
              setImage={setBgId}
              valueKey="authScreenBgImageId"
            />

            <SettingsFormField
              description="This URL will communicate to the live_map resource in your FiveM server"
              errorMessage={errors.liveMapURL}
              label="Live Map URL"
            >
              <Input
                type="url"
                name="liveMapURL"
                value={values.liveMapURL}
                onChange={handleChange}
                placeholder="ws://my-host:my-port"
              />
            </SettingsFormField>

            <SettingsFormField
              optional
              action="short-input"
              label="Inactivity Timeout"
              description="Calls/incidents/units that have not been updated after this timeout will be automatically ended/set off-duty. The format must be in minutes. (Default: none)"
              errorMessage={errors.inactivityTimeout}
            >
              <Input
                type="number"
                name="inactivityTimeout"
                value={values.inactivityTimeout}
                onChange={handleChange}
                placeholder="120"
              />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              description="The prefix for weights (e.g.: kg, lbs)"
              errorMessage={errors.weightPrefix}
              label="Weight Prefix"
            >
              <Input name="weightPrefix" value={values.weightPrefix} onChange={handleChange} />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              description="The prefix for heights (e.g.: cm, inch)"
              errorMessage={errors.heightPrefix}
              label="Height Prefix"
            >
              <Input name="heightPrefix" value={values.heightPrefix} onChange={handleChange} />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              description="The maximum amount of businesses a citizen can create. (Default: Infinity)"
              errorMessage={errors.maxBusinessesPerCitizen}
              label="Max businesses per citizen"
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
              description="The maximum amount of citizens a user can create. (Default: Infinity)"
              errorMessage={errors.maxCitizensPerUser}
              label="Max citizens per user"
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
              description="The maximum amount of units a user can create with a certain department. (Default: Infinity)"
              errorMessage={errors.maxDepartmentsEachPerUser}
              label="Max departments per unit per user"
            >
              <Input
                name="maxDepartmentsEachPerUser"
                type="number"
                value={values.maxDepartmentsEachPerUser}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              label="Max divisions per officer"
              action="short-input"
              description="The maximum amount of divisions per officer. (Default: Infinity)"
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

            <SettingsFormField
              label="Max assignments to incidents per officer"
              action="short-input"
              description="The maximum amount of how many incidents an officer can be assigned to.  (Default: Infinity)"
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
              label="Max assignments to calls per unit"
              action="short-input"
              description="The maximum amount of how many calls a unit can be assigned to. (Default: Infinity)"
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
              label="Max officers per user"
              action="short-input"
              description="The maximum amount of officers per user. (Default: Infinity)"
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
              description="The maximum allowed plate length. (Default: 8)"
              errorMessage={errors.maxPlateLength}
              label="Max plate length"
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
              // todo: add template information for allowed properties
              description={null}
              errorMessage={errors.callsignTemplate}
              label="Callsign Template"
            >
              <Input
                name="callsignTemplate"
                value={values.callsignTemplate}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              description="This template will be used to generate a callsign for paired/merged officers."
              errorMessage={errors.pairedUnitTemplate}
              label="Paired Unit Template"
            >
              <Input
                name="pairedUnitTemplate"
                value={values.pairedUnitTemplate}
                onChange={handleChange}
              />
            </SettingsFormField>

            <Button className="flex items-center" type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
