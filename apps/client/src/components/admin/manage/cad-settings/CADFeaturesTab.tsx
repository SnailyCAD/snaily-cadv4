import * as React from "react";
import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { CadFeature, Feature } from "@snailycad/types";
import { Button, Loader, TextField, TabsContent } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import { DEFAULT_DISABLED_FEATURES } from "hooks/useFeatureEnabled";
import type { PutCADFeaturesData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";

const featuresWithURL: string[] = [
  Feature.BLEETER,
  Feature.DISCORD_AUTH,
  Feature.STEAM_OAUTH,
  Feature.FORCE_DISCORD_AUTH,
  Feature.FORCE_STEAM_AUTH,
  Feature.DMV,
  Feature.BUREAU_OF_FIREARMS,
  Feature.COURTHOUSE,
  Feature.COURTHOUSE_POSTS,
  Feature.TONES,
  Feature.ACTIVE_WARRANTS,
  Feature.WARRANT_STATUS_APPROVAL,
  Feature.ACTIVE_INCIDENTS,
  Feature.LICENSE_EXAMS,
];

export function CADFeaturesTab() {
  const [search, setSearch] = React.useState("");

  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const tFeature = useTranslations("Features");

  const featuresList = React.useMemo(() => {
    return Object.values(Feature).map((feature) => {
      const hasURL = featuresWithURL.includes(feature);

      const name = tFeature(feature);
      const url = hasURL ? tFeature(`${feature}-url`) : null;
      const description = tFeature.rich(`${feature}-description`, {
        b: (children) => <b>{children}</b>,
      });

      return { feature, name, description, url };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function createInitialValues() {
    const obj = {} as Partial<Record<Feature, Pick<CadFeature, "feature" | "isEnabled">>>;

    const cadFeatures = cad?.features;
    for (const key in cadFeatures) {
      const feature = cadFeatures[key as keyof typeof cadFeatures];

      obj[key as Feature] = {
        feature: key as Feature,
        isEnabled: feature,
      };
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

  const filteredFeatures = featuresList.filter((feature) =>
    !search.trim() ? true : feature.name.toLowerCase().includes(search.toLowerCase()),
  );

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
            {filteredFeatures.map((feature) => {
              return (
                <div key={feature.feature}>
                  <SettingsFormField
                    action="checkbox"
                    description={
                      <>
                        {feature.description}{" "}
                        {feature.url ? (
                          <Link
                            className="mt-1 underline flex items-center gap-1 text-blue-500"
                            target="_blank"
                            href={feature.url}
                          >
                            {common("learnMore")}
                            <BoxArrowUpRight className="inline-block" />
                          </Link>
                        ) : null}
                      </>
                    }
                    label={feature.name}
                  >
                    <Toggle
                      value={
                        values.features[feature.feature]?.isEnabled ??
                        // @ts-expect-error - this is fine
                        DEFAULT_DISABLED_FEATURES[key]?.isEnabled ??
                        true
                      }
                      onCheckedChange={(v) => {
                        handleChange(v);
                      }}
                      name={`features.${feature.feature}.isEnabled`}
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
