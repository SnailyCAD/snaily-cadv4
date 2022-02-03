import * as React from "react";
import { Formik, FormikHelpers } from "formik";
import { useTranslations } from "use-intl";

import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Input } from "components/form/inputs/Input";
import { FormRow } from "components/form/FormRow";
import type { MiscCadSettings } from "@snailycad/types";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";

export function MiscFeatures() {
  const [headerId, setHeaderId] = React.useState<(File | string) | null>(null);
  const [bgId, setBgId] = React.useState<(File | string) | null>(null);

  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();

  // infinity -> null, "" -> null
  function cleanValues(values: typeof INITIAL_VALUES) {
    const newValues: Record<string, any> = {};
    const excluded = ["heightPrefix", "weightPrefix", "pairedUnitSymbol", "callsignTemplate"];

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
    maxOfficersPerUser: miscSettings.maxOfficersPerUser ?? Infinity,
    pairedUnitSymbol: miscSettings.pairedUnitSymbol ?? "",
    callsignTemplate: miscSettings.callsignTemplate ?? "",
    liveMapURL: miscSettings.liveMapURL ?? "",
  };

  return (
    <div className="mt-3">
      <h2 className="text-2xl font-semibold">Misc. Settings</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, errors, values }) => (
          <form className="mt-3 space-y-5" onSubmit={handleSubmit}>
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

            <FormRow>
              <FormField errorMessage={errors.weightPrefix} label="Weight Prefix">
                <Input name="weightPrefix" value={values.weightPrefix} onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.heightPrefix} label="Height Prefix">
                <Input name="heightPrefix" value={values.heightPrefix} onChange={handleChange} />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField
                errorMessage={errors.maxBusinessesPerCitizen}
                label="Max businesses per citizen"
              >
                <Input
                  name="maxBusinessesPerCitizen"
                  type="number"
                  value={values.maxBusinessesPerCitizen}
                  onChange={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.maxCitizensPerUser} label="Max citizens per user">
                <Input
                  name="maxCitizensPerUser"
                  type="number"
                  value={values.maxCitizensPerUser}
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField
                errorMessage={errors.maxDivisionsPerOfficer}
                label="Max divisions per officer"
              >
                <Input
                  name="maxDivisionsPerOfficer"
                  type="number"
                  value={values.maxDivisionsPerOfficer}
                  onChange={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.maxOfficersPerUser} label="Max officers per user">
                <Input
                  name="maxOfficersPerUser"
                  type="number"
                  value={values.maxOfficersPerUser}
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.maxPlateLength} label="Max plate length">
              <Input
                name="maxPlateLength"
                type="number"
                value={values.maxPlateLength}
                onChange={handleChange}
              />
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.pairedUnitSymbol} label="Paired unit symbol">
                <Input
                  name="pairedUnitSymbol"
                  value={values.pairedUnitSymbol}
                  onChange={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.callsignTemplate} label="Callsign Template">
                <Input
                  name="callsignTemplate"
                  value={values.callsignTemplate}
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.liveMapURL} label="Live Map URL">
              <Input
                type="url"
                name="liveMapURL"
                value={values.liveMapURL}
                onChange={handleChange}
                placeholder="ws://my-host:my-port"
              />
            </FormField>

            <Button className="flex items-center" type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </div>
  );
}
