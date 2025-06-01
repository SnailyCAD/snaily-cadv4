import * as React from "react";
import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";

import { Loader, Input, Button } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { JailTimeScale, type MiscCadSettings } from "@snailycad/types";
import { SettingsFormField } from "components/form/SettingsFormField";
import { Select } from "components/form/Select";
import { toastMessage } from "lib/toastMessage";
import type { PutCADMiscSettingsData } from "@snailycad/types/api";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

// infinity -> null, "" -> null
export function cleanValues(values: Record<string, any>) {
  const newValues: Record<string, any> = {};
  const excluded = ["heightPrefix", "weightPrefix", "callsignTemplate"];
  const toBeRemoved = ["authScreenHeaderImageId", "authScreenBgImageId"];

  for (const key in values) {
    const value = values[key];

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
      newValues[key] = values[key];
    }
  }

  return newValues;
}

export function OtherMiscTab() {
  const common = useTranslations("Common");
  const t = useTranslations("MiscSettingsTab");
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!cad) return;

    const { json } = await execute<PutCADMiscSettingsData>({
      path: "/admin/manage/cad-settings/misc",
      method: "PUT",
      data: { ...cad.miscCadSettings, ...cleanValues(values) },
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

  const miscSettings = cad?.miscCadSettings ?? ({} as MiscCadSettings);
  const INITIAL_VALUES = {
    weightPrefix: miscSettings.weightPrefix,
    heightPrefix: miscSettings.heightPrefix,
    jailTimeScaling: miscSettings.jailTimeScale ?? null,
    // how many times a signal 100 should be repeated.
    signal100RepeatAmount: miscSettings.signal100RepeatAmount ?? 1,
    // the amount between each signal 100 repeat.
    signal100RepeatIntervalMs: miscSettings.signal100RepeatIntervalMs ?? 1_000,
  };

  return (
    <TabsContent value={SettingsTabs.Other} className="mt-3">
      <h2 className="text-2xl font-semibold">{t("miscSettings")}</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form className="mt-3 space-y-5">
            <h3 className="font-semibold text-2xl mb-3">{t("other")}</h3>

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

            <SettingsFormField
              action="short-input"
              description={t("signal100RepeatAmountDescription")}
              errorMessage={errors.signal100RepeatAmount}
              label={t("signal100RepeatAmount")}
            >
              <Input
                name="signal100RepeatAmount"
                type="number"
                value={values.signal100RepeatAmount}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

            <SettingsFormField
              action="short-input"
              description={t("signal100RepeatIntervalMsDescription")}
              errorMessage={errors.signal100RepeatIntervalMs}
              label={t("signal100RepeatIntervalMs")}
            >
              <Input
                name="signal100RepeatIntervalMs"
                type="number"
                value={values.signal100RepeatIntervalMs}
                onChange={handleChange}
                min={1}
              />
            </SettingsFormField>

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
