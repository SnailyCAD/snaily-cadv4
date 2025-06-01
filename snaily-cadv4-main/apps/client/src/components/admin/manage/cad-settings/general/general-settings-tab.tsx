import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import {
  Button,
  Input,
  Loader,
  SelectField,
  SwitchField,
  TextField,
  Textarea,
} from "@snailycad/ui";
import { handleValidate } from "lib/handleValidate";
import { CAD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Formik, type FormikHelpers } from "formik";
import { toastMessage } from "lib/toastMessage";
import type { PutCADSettingsData } from "@snailycad/types/api";
import { TabsContent } from "@radix-ui/react-tabs";
import { SettingsTabs } from "components/admin/cad-settings/layout";

import timeZones from "./timezones.json";

export function GeneralSettingsTab() {
  const [logo, setLogo] = React.useState<(File | string) | null>(null);
  const [headerId, setHeaderId] = React.useState<(File | string) | null>(null);
  const [bgId, setBgId] = React.useState<(File | string) | null>(null);

  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const { AOP } = useFeatureEnabled();
  const t = useTranslations("CadSettings");
  const common = useTranslations("Common");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const fd = new FormData();
    const validatedLogo = validateFile(logo, helpers);
    const header = validateFile(headerId, helpers);
    const background = validateFile(bgId, helpers);
    let authImgCount = 0;

    if (header || background) {
      if (header && typeof header !== "string") {
        authImgCount += 1;
        fd.append("files", header, "authScreenHeaderImageId");
      }

      if (background && typeof background !== "string") {
        authImgCount += 1;
        fd.append("files", background, "authScreenBgImageId");
      }
    }

    if (validatedLogo) {
      if (typeof validatedLogo !== "string") {
        fd.set("image", validatedLogo, validatedLogo.name);
      }
    }

    const { json } = await execute<PutCADSettingsData, typeof INITIAL_VALUES>({
      path: "/admin/manage/cad-settings",
      method: "PUT",
      data: values,
      helpers,
    });

    if (json?.id) {
      if (authImgCount > 0) {
        await Promise.allSettled([
          execute({
            path: "/admin/manage/cad-settings/image/auth",
            method: "POST",
            data: fd,
            headers: {
              "content-type": "multipart/form-data",
            },
          }),
        ]);
      }

      if (validatedLogo && typeof validatedLogo === "object") {
        const {
          json: { logoId },
        } = await execute<PutCADSettingsData, typeof INITIAL_VALUES>({
          path: "/admin/manage/cad-settings/image",
          method: "POST",
          data: fd,
          helpers,
          headers: {
            "content-type": "multipart/form-data",
          },
        });

        json.logoId = logoId;
      }

      toastMessage({
        icon: "success",
        title: common("success"),
        message: common("savedSettingsSuccess"),
      });
      setCad({ ...cad, ...json });
    }
  }

  if (!cad) {
    return null;
  }

  const validate = handleValidate(CAD_SETTINGS_SCHEMA);
  const INITIAL_VALUES = {
    name: cad.name ?? "",
    areaOfPlay: cad.areaOfPlay ?? "",
    steamApiKey: cad.steamApiKey ?? "",
    registrationCode: cad.registrationCode ?? "",
    roleplayEnabled: cad.miscCadSettings?.roleplayEnabled ?? true,
    cadOGDescription: cad.miscCadSettings?.cadOGDescription ?? "",
    timeZone: cad?.timeZone ?? null,
  };

  return (
    <TabsContent value={SettingsTabs.GeneralSettings}>
      <h2 className="text-2xl font-semibold">{t("generalSettings")}</h2>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
          <form autoComplete="off" className="mt-3" onSubmit={handleSubmit}>
            <SettingsFormField
              errorMessage={errors.name}
              action="input"
              label={t("cadName")}
              description={t.rich("cadNameDescription", {
                span: (children) => (
                  <span className="text-base italic font-semibold">{children}</span>
                ),
              })}
            >
              <Input onChange={handleChange} value={values.name} name="name" />
            </SettingsFormField>

            <SettingsFormField
              label={t("cadOpenGraphDescription")}
              description={t("cadOpenGraphDescriptionInfo")}
              errorMessage={errors.cadOGDescription}
              optional
            >
              <Textarea
                name="cadOGDescription"
                value={values.cadOGDescription}
                onChange={handleChange}
              />
            </SettingsFormField>

            <SettingsFormField
              label={t("timeZone")}
              description={t("timeZoneDescription")}
              errorMessage={errors.timeZone}
              optional
            >
              <SelectField
                name="timeZone"
                label={t("timeZone")}
                options={timeZones.map((tz) => ({
                  label: tz,
                  value: tz,
                }))}
                selectedKey={values.timeZone}
                onSelectionChange={(value) => setFieldValue("timeZone", value)}
              />
            </SettingsFormField>

            {AOP ? (
              <SettingsFormField
                optional
                errorMessage={errors.steamApiKey}
                action="input"
                label={t("areaOfPlay")}
                description={t("areaOfPlayDescription")}
              >
                <Input onChange={handleChange} value={values.areaOfPlay} name="areaOfPlay" />
              </SettingsFormField>
            ) : null}

            <SettingsFormField
              optional
              errorMessage={errors.registrationCode}
              action="input"
              label={t("registrationCode")}
              description={t("registrationCodeDescription")}
            >
              <TextField
                label={t("registrationCode")}
                type="password"
                inputElementType="input"
                onFocus={(event) => (event.target as HTMLInputElement).select()}
                value={String(values.registrationCode)}
                onChange={(value) => setFieldValue("registrationCode", value)}
                autoComplete="off"
                isOptional
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.roleplayEnabled}
              action="checkbox"
              label={t("roleplayEnabled")}
              description={t("roleplayEnabledDescription")}
            >
              <SwitchField
                aria-label={t("roleplayEnabled")}
                isSelected={values.roleplayEnabled}
                onChange={(isSelected) => setFieldValue("roleplayEnabled", isSelected)}
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.name}
              action="input"
              label={t("cadLogo")}
              description={t.rich("cadLogoDescription", {
                span: (children) => (
                  <span className="text-base italic font-semibold">{children}</span>
                ),
              })}
            >
              <ImageSelectInput label={t("cadLogo")} image={logo} setImage={setLogo} />
            </SettingsFormField>

            <SettingsFormField optional label={t("authScreenHeaderImage")} description={null}>
              <ImageSelectInput
                label={t("authScreenHeaderImage")}
                image={headerId}
                setImage={setHeaderId}
                valueKey="authScreenHeaderImageId"
              />
            </SettingsFormField>

            <SettingsFormField optional label={t("authScreenBackgroundImage")} description={null}>
              <ImageSelectInput
                label={t("authScreenBackgroundImage")}
                image={bgId}
                setImage={setBgId}
                valueKey="authScreenBgImageId"
              />
            </SettingsFormField>

            <Button
              disabled={state === "loading"}
              className="flex items-center float-right"
              type="submit"
            >
              {state === "loading" ? <Loader className="mr-3" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </TabsContent>
  );
}
