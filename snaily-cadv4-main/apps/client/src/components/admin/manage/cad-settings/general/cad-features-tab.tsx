import * as React from "react";
import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import {
  type CadFeature,
  type CadFeatureOptions,
  CourthouseType,
  Feature,
  LicenseExamType,
} from "@snailycad/types";
import { Button, Loader, TextField, SelectField, SwitchField } from "@snailycad/ui";
import { SettingsFormField } from "components/form/SettingsFormField";
import { toastMessage } from "lib/toastMessage";
import { DEFAULT_DISABLED_FEATURES, DEFAULT_FEATURE_OPTIONS } from "hooks/useFeatureEnabled";
import type { PutCADFeaturesData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

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

    const { options, ...cadFeatures } = cad?.features ?? {};
    for (const key in cadFeatures) {
      const feature = cadFeatures[key as keyof typeof cadFeatures];

      obj[key as Feature] = {
        feature: key as Feature,
        isEnabled: feature,
      };
    }

    return obj;
  }

  function createInitialOptions() {
    const obj = {} as CadFeatureOptions;

    const cadFeatures = cad?.features;
    for (const _key in cadFeatures) {
      const typedKey = _key as keyof CadFeatureOptions;
      const option = cadFeatures.options?.[typedKey] ?? DEFAULT_FEATURE_OPTIONS[typedKey];

      if (option) {
        // @ts-expect-error the types are overlapping, however, it will correctly assign the correct value
        obj[typedKey] = option;
      }
    }

    return obj;
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!cad) return;
    const featuresArr = Object.entries(values.features).map(([key, value]) => {
      const extraFields = values.options[key as keyof CadFeatureOptions] ?? undefined;

      return {
        feature: key as Feature,
        isEnabled: value.isEnabled,
        extraFields,
      };
    });

    const { json } = await execute<PutCADFeaturesData>({
      path: "/admin/manage/cad-settings/features",
      method: "PUT",
      data: { features: featuresArr, options: values.options },
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
    options: createInitialOptions(),
  };

  const filteredFeatures = featuresList.filter((feature) =>
    !search.trim() ? true : feature.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <TabsContent value={SettingsTabs.Features} className="mt-3">
      <h2 className="text-2xl font-semibold">{tFeature("enableOrDisableFeatures")}</h2>

      <TextField
        label={common("search")}
        className="mt-3 mb-2.5"
        name="search"
        value={search}
        onChange={(value) => setSearch(value)}
        placeholder={tFeature("searchFeatures")}
      />

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values }) => (
          <Form>
            {filteredFeatures.map((feature) => {
              return (
                <div key={feature.feature}>
                  <SettingsFormField
                    action="checkbox"
                    description={
                      <>
                        {feature.description}{" "}
                        {feature.feature in values.options ? (
                          <div className="mt-2">
                            <h4 className="font-semibold text-lg mb-2">Extra Options</h4>

                            {Feature.LICENSE_EXAMS === feature.feature ? (
                              <SelectField
                                isDisabled={!values.features[feature.feature]?.isEnabled}
                                isClearable
                                selectedKeys={values.options[feature.feature]}
                                onSelectionChange={(keys) =>
                                  setFieldValue(`options.${feature.feature}`, keys)
                                }
                                selectionMode="multiple"
                                label="Types"
                                options={Object.values(LicenseExamType).map((v) => ({
                                  label: v.toLowerCase(),
                                  value: v,
                                }))}
                              />
                            ) : Feature.COURTHOUSE === feature.feature ? (
                              <SelectField
                                isDisabled={!values.features[feature.feature]?.isEnabled}
                                isClearable
                                selectedKeys={values.options[feature.feature]}
                                onSelectionChange={(keys) =>
                                  setFieldValue(`options.${feature.feature}`, keys)
                                }
                                selectionMode="multiple"
                                label={tFeature("types")}
                                options={Object.values(CourthouseType).map((v) => ({
                                  label: tFeature(v),
                                  value: v,
                                }))}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    }
                    label={
                      <span className="flex items-center justify-between w-full">
                        {feature.name}

                        {feature.url ? (
                          <Link
                            className="text-base mt-1 underline flex items-center gap-1 text-blue-500"
                            target="_blank"
                            href={feature.url}
                          >
                            {common("learnMore")}
                            <BoxArrowUpRight className="inline-block" />
                          </Link>
                        ) : null}
                      </span>
                    }
                  >
                    <SwitchField
                      aria-label={feature.name}
                      isSelected={
                        values.features[feature.feature]?.isEnabled ??
                        // @ts-expect-error - this is fine
                        DEFAULT_DISABLED_FEATURES[feature.feature]?.isEnabled ??
                        true
                      }
                      onChange={(isSelected) =>
                        setFieldValue(`features.${feature.feature}.isEnabled`, isSelected)
                      }
                      name="enabled"
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
