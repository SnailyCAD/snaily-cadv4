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
            <FormField boldLabel label={"Tow"}>
              <Toggle toggled={values[feature.TOW]} onClick={handleChange} name={feature.TOW} />
              <small className="mt-2 text-base">
                Enable/Disable tow. When enabled, this will allow citizens to call tow.
              </small>
            </FormField>

            <FormField boldLabel label={"Bleeter"}>
              <Toggle
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

            <FormField boldLabel label={"Courthouse"}>
              <Toggle
                toggled={values[feature.COURTHOUSE]}
                onClick={handleChange}
                name={feature.COURTHOUSE}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow citizens to create expungement requests
              </small>
            </FormField>

            <FormField boldLabel label={"Taxi"}>
              <Toggle toggled={values[feature.TAXI]} onClick={handleChange} name={feature.TAXI} />
              <small className="mt-2 text-base">
                When enabled, this will allow citizens to call a taxi to pick them up.
              </small>
            </FormField>

            <FormField boldLabel label={"Truck Logs"}>
              <Toggle
                toggled={values[feature.TRUCK_LOGS]}
                onClick={handleChange}
                name={feature.TRUCK_LOGS}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow citizens to create truck logs and track their
                progress.
              </small>
            </FormField>

            <FormField boldLabel label={"Area of Play"}>
              <Toggle toggled={values[feature.AOP]} onClick={handleChange} name={feature.AOP} />
              <small className="mt-2 text-base">
                {/* eslint-disable-next-line quotes */}
                {'When disabled, this will hide "- AOP: aop here"'}
              </small>
            </FormField>

            <FormField boldLabel label={"Businesses"}>
              <Toggle
                toggled={values[feature.BUSINESS]}
                onClick={handleChange}
                name={feature.BUSINESS}
              />
              <small className="mt-2 text-base">
                When enabled, citizens will be able to create and join businesses
              </small>
            </FormField>

            <FormField boldLabel label={"Allow Duplicate Citizen Names"}>
              <Toggle
                toggled={values[feature.ALLOW_DUPLICATE_CITIZEN_NAMES]}
                onClick={handleChange}
                name={feature.ALLOW_DUPLICATE_CITIZEN_NAMES}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow users to create citizens with the same name (name and
                surname)
              </small>
            </FormField>

            <FormField boldLabel label={"Allow users to authenticate with Discord."}>
              <Toggle
                toggled={values[feature.DISCORD_AUTH]}
                onClick={handleChange}
                name={feature.DISCORD_AUTH}
              />
              <small className="mt-2 text-base">
                When enabled, this will allow users to login and register with Discord.{" "}
                <a href="https://cad-docs.netlify.app/other/discord-authentication">
                  Click here for Documentation
                </a>
              </small>
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
};
