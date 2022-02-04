import * as React from "react";
import { Formik } from "formik";
import { useTranslations } from "use-intl";

import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { Feature } from "@snailycad/types";
import { Input } from "components/form/inputs/Input";

const FEATURES = Object.keys(Feature) as Feature[];

interface FeatureItem {
  name: string;
  description: string | React.ReactNode;
}

const FEATURES_LIST: Record<Feature, FeatureItem> = {
  TOW: {
    name: "Tow",
    description: "Enable/Disable tow. When enabled, this will allow citizens to call tow.",
  },
  TAXI: {
    name: "Taxi",
    description: "When enabled, this will allow citizens to call a taxi to pick them up.",
  },
  TRUCK_LOGS: {
    name: "Truck Logs",
    description:
      "When enabled, this will allow citizens to create truck logs and track their progress.",
  },
  AOP: {
    name: "Area Of Play",
    // eslint-disable-next-line quotes
    description: 'When disabled, this will hide "- AOP: aop here"',
  },
  BUSINESS: {
    name: "Businesses",
    description: "When enabled, citizens will be able to create and join businesses",
  },
  ALLOW_DUPLICATE_CITIZEN_NAMES: {
    name: "Allow Duplicate Citizen Names",
    description:
      "When enabled, this will allow users to create citizens with the same name (name and surname)",
  },
  DISCORD_AUTH: {
    name: "Allow users to authenticate with Discord.",
    description: (
      <>
        When enabled, this will allow users to login and register with Discord.{" "}
        <a href="https://cad-docs.netlify.app/other/discord-authentication">
          Click here for Documentation
        </a>
      </>
    ),
  },
  BLEETER: {
    name: "Bleeter",
    description: (
      <>
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
      </>
    ),
  },
  COURTHOUSE: {
    name: "Courthouse",
    description: "When enabled, this will allow citizens to create expungement requests.",
  },
  WEAPON_REGISTRATION: {
    name: "Weapon Registration",
    description: "When disabled, this will disallow citizens to register weapons.",
  },
  CALLS_911: {
    name: "911 Calls",
    description: "When disabled, this will disable the use of 911-calls.",
  },
  SOCIAL_SECURITY_NUMBERS: {
    name: "Social Security Numbers",
    description: "When disabled, this will hide social security numbers",
  },
  DISALLOW_TEXTFIELD_SELECTION: {
    name: "Disallow custom values",
    description:
      "When disabled, this will allow users to enter custom vehicle/weapon values when registering a vehicle/weapon",
  },
  ACTIVE_DISPATCHERS: {
    name: "Active Dispatchers",
    description:
      "When enabled, curtain buttons on the LEO and EMS/FD dashboard will become disabled when there is an active dispatcher.",
  },
};

export function DisabledFeaturesArea() {
  const [search, setSearch] = React.useState("");

  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();

  function createInitialValues() {
    const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

    for (const feature of FEATURES) {
      obj[feature] = !cad?.disabledFeatures?.includes(feature);
    }

    return obj;
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const featuresArr = Object.entries(values)
      .map(([key, value]) => {
        return !value ? key : null;
      })
      .filter(Boolean);

    const { json } = await execute("/admin/manage/cad-settings/features", {
      method: "PUT",
      data: { features: featuresArr },
    });

    if (json.id) {
      setCad({ ...cad, ...json });
      setSearch("");
    }
  }

  const INITIAL_VALUES = createInitialValues();
  const features = Object.entries(FEATURES_LIST).filter(([, v]) =>
    !search.trim() ? true : v.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mt-3">
      <h2 className="text-2xl font-semibold">Enable or disable features</h2>

      <FormField label={common("search")} className="mt-3 mb-10">
        <Input
          placeholder="Find features.."
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          className=""
        />
      </FormField>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, values }) => (
          <form className="mt-3 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {features.map(([key, value]) => {
                return (
                  <div key={key}>
                    <FormField checkbox boldLabel label={value.name}>
                      <Toggle
                        toggled={values[Feature[key as Feature]]}
                        onClick={handleChange}
                        name={Feature[key as Feature]}
                      />
                    </FormField>
                    <small className="mt-2 text-base">{value.description}</small>
                  </div>
                );
              })}
            </div>

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
