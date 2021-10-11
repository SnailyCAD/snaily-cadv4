import { Formik } from "formik";
import { useTranslations } from "use-intl";

import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { feature, Feature } from "types/prisma";

const FEATURES = Object.keys(feature) as Feature[];

export const DisabledFeaturesArea = () => {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();

  function createInitialValues() {
    const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

    for (const feature of FEATURES) {
      obj[feature] = !cad?.disabledFeatures.includes(feature) ?? true;
    }

    return obj;
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const featuresArr = Object.entries(values)
      .map(([key, value]) => {
        return value === false ? key : null;
      })
      .filter(Boolean);

    const { json } = await execute("/admin/manage/cad-settings/features", {
      method: "PUT",
      data: { features: featuresArr },
    });

    if (json.id) {
      setCad({ ...cad, ...json });
    }
  }

  const INITIAL_VALUES = createInitialValues();

  return (
    <div className="mt-3">
      <h2 className="text-2xl font-semibold">Enable or disable features</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, values }) => (
          <form className="mt-3 space-y-5" onSubmit={handleSubmit}>
            <FormField fieldId="tow" label={"Tow"}>
              <Toggle
                text="enable/disable"
                toggled={values[feature.TOW]}
                onClick={handleChange}
                name={feature.TOW}
              />
              <small className="mt-2 text-base">
                Enable/Disable tow. When enabled, this will allow citizens to call tow.
              </small>
            </FormField>

            <FormField fieldId="bleeter" label={"Bleeter"}>
              <Toggle
                text="enable/disable"
                toggled={values[feature.BLEETER]}
                onClick={handleChange}
                name={feature.BLEETER}
              />
              <small className="mt-2 text-base">
                Bleeter is like twitter but for GTA,{" "}
                <a
                  href="https://gta.fandom.com/wiki/Bleeter"
                  rel="noreferrer noopener"
                  target="_blank"
                  className="underline"
                >
                  find more information here
                </a>
                .
              </small>
            </FormField>

            <FormField fieldId="courthouse" label={"Courthouse"}>
              <Toggle
                text="enable/disable"
                toggled={values[feature.COURTHOUSE]}
                onClick={handleChange}
                name={feature.COURTHOUSE}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow citizens to create expungement requests
              </small>
            </FormField>

            <FormField fieldId="taxi" label={"Taxi"}>
              <Toggle
                text="enable/disable"
                toggled={values[feature.TAXI]}
                onClick={handleChange}
                name={feature.TAXI}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow citizens to call a taxi to pick them up.
              </small>
            </FormField>

            <FormField fieldId="truck-logs" label={"Truck Logs"}>
              <Toggle
                text="enable/disable"
                toggled={values[feature.TRUCK_LOGS]}
                onClick={handleChange}
                name={feature.TRUCK_LOGS}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow citizens to create truck logs and track their
                progress.
              </small>
            </FormField>

            <FormField fieldId="aop" label={"Area of Play"}>
              <Toggle
                text="enable/disable"
                toggled={values[feature.AOP]}
                onClick={handleChange}
                name={feature.AOP}
              />
              <small className="mt-2 text-base">
                {/* eslint-disable-next-line quotes */}
                {'When disabled, this will hide "- AOP: aop here"'}
              </small>
            </FormField>

            <Button className="flex items-center" type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Loader className="border-red-300 mr-3" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </div>
  );
};
