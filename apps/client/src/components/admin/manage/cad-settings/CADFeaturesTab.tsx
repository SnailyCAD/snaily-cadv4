import * as React from "react";
import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import type { CadFeature, Feature } from "@snailycad/types";
import { Button, Loader, TextField } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { TabsContent } from "components/shared/TabList";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import { DEFAULT_DISABLED_FEATURES } from "hooks/useFeatureEnabled";
import type { PutCADFeaturesData } from "@snailycad/types/api";

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
  LICENSE_EXAMS: {
    name: "License Exams",
    description:
      "When enabled, this will require citizens to participate in an exam before getting their required licenses.",
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
    name: "Allow users to authenticate with Discord",
    description: (
      <>
        When enabled, this will allow users to login and register with Discord.{" "}
        <a
          className="underline"
          href="https://cad-docs.caspertheghost.me/docs/discord-integration/discord-authentication"
        >
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
      "When enabled, certain buttons on the LEO and EMS/FD dashboard will become disabled when there is an active dispatcher.",
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
  BADGE_NUMBERS: {
    name: "Badge numbers",
    description: "When enabled, this will require officers to enter a badge number.",
  },
  USER_API_TOKENS: {
    name: "User API Tokens",
    description:
      "When enabled, this will allow users to generate their own API token to perform actions with via their account.",
  },
  CITIZEN_RECORD_APPROVAL: {
    name: "Citizen Record Approvals",
    description:
      "When enabled, this will require supervisors to accept or decline arrest reports before they can be used.",
  },
  COMMON_CITIZEN_CARDS: {
    name: "Common Citizen Cards",
    description:
      "When enabled, this will allow any officers to edit, register vehicles/weapons to, create medical records to any citizen.",
  },
  STEAM_OAUTH: {
    name: "Steam OAuth",
    description: (
      <>
        When enabled, this will allow users to login and register with Steam.{" "}
        <a
          className="underline"
          href="https://cad-docs.caspertheghost.me/docs/steam-integration/steam-authentication"
        >
          Click here for Documentation
        </a>
      </>
    ),
  },
  CREATE_USER_CITIZEN_LEO: {
    name: "Create non-existing citizens/vehicles (LEO)",
    description:
      "When enabled, this will allow officers to create citizens and vehicles that don't exist yet when searching for them. This citizen/vehicle will not be connected to any user.",
  },
  LEO_TICKETS: {
    name: "LEO Tickets",
    description: "When enabled, this will allow officers to write tickets to citizens",
  },
  LEO_BAIL: {
    name: "Bails",
    description: "When enabled, this will allow officers to add bails to arrest reports",
  },
  COURTHOUSE_POSTS: {
    name: "Courthouse Posts",
    description:
      "When enabled, this will allow users with the correct permissions to create posts in the courthouse. These posts will be visible to anyone.",
  },
  ACTIVE_WARRANTS: {
    name: "Active Warrants",
    description: "When enabled, this will display active warrants on the LEO Dashboard.",
  },
  CITIZEN_DELETE_ON_DEAD: {
    name: "Delete citizen on dead",
    description: "When enabled, this will delete all citizen's data when they are declared dead.",
  },
  PANIC_BUTTON: {
    name: "Panic Buttons",
    description: "When enabled, this will allow LEO and EMS-FD to press a panic button.",
  },
  WARRANT_STATUS_APPROVAL: {
    name: "Warrant Status Approval",
    description: "When enabled, this will require supervisors to approve 'active' warrants.",
  },
  DIVISIONS: {
    name: "Divisions",
    description:
      "When enabled, this will require officers and EMS-FD deputies to provide their division(s).",
  },
  TONES: {
    name: "Tones",
    description:
      "When enabled, this will allow Dispatch to create temporary messages for LEO and EMS/FD.",
  },
  CITIZEN_CREATION_RECORDS: {
    name: "Citizen Creation Records",
    description: "When enabled, this allow citizens to add charges and flags to their citizen.",
  },
  BUREAU_OF_FIREARMS: {
    name: "Bureau of Firearms",
    description:
      "When enabled, weapons must first be approved by the Bureau of Firearms within the CAD.",
  },
  CALL_911_APPROVAL: {
    name: "Calls 911 Approval",
    description:
      "When a citizen creates a 911 call and there are active dispatchers, this will require dispatch to approve the call before active units can view the call.",
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
    if (!cad) return;
    const featuresArr = Object.entries(values.features).map(([key, value]) => ({
      feature: key as Feature,
      isEnabled: value.isEnabled,
    }));

    const { json } = await execute<PutCADFeaturesData>({
      path: "/admin/manage/cad-settings/features",
      method: "PUT",
      data: { features: featuresArr },
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

  const INITIAL_VALUES = {
    features: createInitialValues(),
  };

  const features = Object.entries(FEATURES_LIST).filter(([, v]) =>
    !search.trim() ? true : v.name.toLowerCase().includes(search.toLowerCase()),
  ) as [Feature, FeatureItem][];

  return (
    <TabsContent value={SettingsTabs.Features} className="mt-3">
      <h2 className="text-2xl font-semibold">Enable or disable features</h2>

      <TextField
        label={common("search")}
        className="mt-3 mb-2.5"
        name="search"
        value={search}
        onChange={(value) => setSearch(value)}
        placeholder="Find features.."
      />

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
                      value={
                        values.features[key]?.isEnabled ??
                        DEFAULT_DISABLED_FEATURES[key]?.isEnabled ??
                        true
                      }
                      onCheckedChange={(v) => {
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
    </TabsContent>
  );
}
