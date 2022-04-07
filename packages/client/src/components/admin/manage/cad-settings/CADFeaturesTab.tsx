import * as React from "react";
import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";

import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import type { CadFeature, Feature } from "@snailycad/types";
import { Input } from "components/form/inputs/Input";
import { SettingsFormField } from "components/form/SettingsFormField";

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
  DL_EXAMS: {
    name: "Driver's License Exams",
    description:
      "When enabled, this will require citizens to enter a driving licenses exam to get a driver's license.",
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
        <a href="https://cad-docs.caspertheghost.me/docs/discord-integration/discord-authentication">
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
  CUSTOM_TEXTFIELD_VALUES: {
    name: "Custom textfield values",
    description:
      "When enabled, this will allow users to enter custom vehicle/weapon values when registering a vehicle/weapon",
  },
  ACTIVE_DISPATCHERS: {
    name: "Active Dispatchers",
    description:
      "When enabled, curtain buttons on the LEO and EMS/FD dashboard will become disabled when there is an active dispatcher.",
  },
  ALLOW_CITIZEN_UPDATE_LICENSE: {
    name: "Allow citizens to update licenses",
    description: "When disabled, this will only allow LEO to manage licenses of citizens.",
  },
  ALLOW_REGULAR_LOGIN: {
    name: "Allow username/password login",
    description: "When disabled, this will only allow users to register/login via Discord.",
  },
  ACTIVE_INCIDENTS: {
    name: "Active Incidents",
    description:
      // eslint-disable-next-line quotes
      'When enabled, dispatch will be able to create "active" incidents that can be viewed on the dispatch page.',
  },
  RADIO_CHANNEL_MANAGEMENT: {
    name: "Radio Channel Management",
    description:
      "When enabled, dispatch will be able to manage the radio channel a unit is in. This can then be used to enhance the experience via the CAD's Public API.",
  },
  ALLOW_CITIZEN_DELETION_BY_NON_ADMIN: {
    name: "Allow citizen deletion by citizen creator",
    description:
      "When disabled, this will only allow administrators to delete citizens. Users who created a citizen will not be able to delete them themselves.",
  },
  DMV: {
    name: "Department of Motor Vehicles (DMV)",
    description:
      "When enabled, vehicles must first be approved by the Department of Motor Vehicles within the CAD.",
  },
};

export function CADFeaturesTab() {
  const [search, setSearch] = React.useState("");

  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();

  function createInitialValues() {
    const obj = {} as Partial<Record<Feature, CadFeature>>;

    const cadFeatures = cad?.features ?? [];
    for (const feature of cadFeatures) {
      obj[feature.feature as Feature] = feature;
    }

    return obj;
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const featuresArr = [];

    for (const feature in values.features) {
      const feat = values.features[feature as Feature];
      const featObj = {
        feature,
        isEnabled: feat?.isEnabled ?? true,
      };

      featuresArr.push(featObj);
    }

    const { json } = await execute("/admin/manage/cad-settings/features", {
      method: "PUT",
      data: { features: featuresArr },
    });

    if (json.id) {
      setCad({ ...cad, ...json });
    }
  }

  const INITIAL_VALUES = {
    features: createInitialValues(),
  };

  const features = Object.entries(FEATURES_LIST).filter(([, v]) =>
    !search.trim() ? true : v.name.toLowerCase().includes(search.toLowerCase()),
  ) as [Feature, FeatureItem][];

  return (
    <div className="mt-3">
      <h2 className="text-2xl font-semibold">Enable or disable features</h2>

      <FormField label={common("search")} className="mt-3 mb-2.5">
        <Input
          placeholder="Find features.."
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          className=""
        />
      </FormField>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values }) => (
          <Form>
            {features.map(([key, value]) => {
              return (
                <div key={key}>
                  <SettingsFormField
                    action="checkbox"
                    description={value.description}
                    label={value.name}
                  >
                    <Toggle
                      toggled={values.features[key]?.isEnabled ?? true}
                      onClick={(v) => {
                        handleChange(v);
                      }}
                      name={`features.${key}.isEnabled`}
                    />
                  </SettingsFormField>
                </div>
              );
            })}

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
