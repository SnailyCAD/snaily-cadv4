import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "use-intl";
import { PasswordInput } from "components/form/inputs/Input";
import { Toggle } from "components/form/Toggle";
import useFetch from "lib/useFetch";
import { Button, Input, Loader, TabsContent } from "@snailycad/ui";
import { handleValidate } from "lib/handleValidate";
import { CAD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Formik, FormikHelpers } from "formik";
import { SettingsTabs } from "src/pages/admin/manage/cad-settings";
import { toastMessage } from "lib/toastMessage";
import type { PutCADSettingsData } from "@snailycad/types/api";

export function GeneralSettingsTab() {
  const [logo, setLogo] = React.useState<(File | string) | null>(null);
  const { state, execute } = useFetch();
  const { cad, setCad } = useAuth();
  const { AOP } = useFeatureEnabled();

  const common = useTranslations("Common");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!cad) return;

    const fd = new FormData();
    const validatedImage = validateFile(logo, helpers);

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    const { json } = await execute<PutCADSettingsData, typeof INITIAL_VALUES>({
      path: "/admin/manage/cad-settings",
      method: "PUT",
      data: values,
      helpers,
    });

    if (json?.id) {
      if (validatedImage && typeof validatedImage === "object") {
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
    towWhitelisted: cad.towWhitelisted ?? false,
    taxiWhitelisted: cad.taxiWhitelisted ?? false,
    whitelisted: cad.whitelisted ?? false,
    businessWhitelisted: cad.businessWhitelisted ?? false,
    registrationCode: cad.registrationCode ?? "",
    roleplayEnabled: cad.miscCadSettings?.roleplayEnabled ?? true,
    logoId: cad.logoId ?? "",
  };

  return (
    <TabsContent value={SettingsTabs.GeneralSettings}>
      <h2 className="text-2xl font-semibold">General Settings</h2>

      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors }) => (
          <form autoComplete="off" className="mt-3" onSubmit={handleSubmit}>
            <SettingsFormField
              errorMessage={errors.name}
              action="input"
              label="CAD Name"
              description="The name to the CAD. This can be the name of your community, etc."
            >
              <Input onChange={handleChange} value={values.name} name="name" />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.name}
              action="input"
              label="CAD Logo"
              description={
                <span className="text-base italic">
                  <b>Note:</b> page reload may be required.
                </span>
              }
            >
              <ImageSelectInput label="CAD Logo" image={logo} setImage={setLogo} />
            </SettingsFormField>

            {AOP ? (
              <SettingsFormField
                optional
                errorMessage={errors.steamApiKey}
                action="input"
                label="Area of Play"
                description="The area where roleplay is currently active"
              >
                <Input onChange={handleChange} value={values.areaOfPlay} name="areaOfPlay" />
              </SettingsFormField>
            ) : null}

            <SettingsFormField
              optional
              errorMessage={errors.registrationCode}
              action="input"
              label="Registration Code"
              description="Users will need to enter this code when creating an account."
            >
              <PasswordInput
                onChange={handleChange}
                value={String(values.registrationCode)}
                name="registrationCode"
                autoComplete="off"
              />
            </SettingsFormField>

            <SettingsFormField
              errorMessage={errors.roleplayEnabled}
              action="checkbox"
              label="Roleplay Enabled"
              description="When disabled, this will display a banner that says that roleplay must be stopped."
            >
              <Toggle
                name="roleplayEnabled"
                onCheckedChange={handleChange}
                value={values.roleplayEnabled}
              />
            </SettingsFormField>

            <section>
              <h3 className="font-semibold text-xl mb-3">Whitelisting</h3>

              <SettingsFormField
                errorMessage={errors.whitelisted}
                action="checkbox"
                label="CAD Whitelist"
                description="The CAD will be whitelisted. Any user that registers will need to be reviewed, they can be accepted or denied"
              >
                <Toggle
                  name="whitelisted"
                  onCheckedChange={handleChange}
                  value={values.whitelisted}
                />
              </SettingsFormField>

              <SettingsFormField
                errorMessage={errors.towWhitelisted}
                action="checkbox"
                label="Tow Whitelist"
                description="Tow will be whitelisted, the permission can be given to any user."
              >
                <Toggle
                  name="towWhitelisted"
                  onCheckedChange={handleChange}
                  value={values.towWhitelisted}
                />
              </SettingsFormField>

              <SettingsFormField
                errorMessage={errors.taxiWhitelisted}
                action="checkbox"
                label="Taxi Whitelist"
                description="Taxi will be whitelisted, the permission can be given to any user."
              >
                <Toggle
                  name="taxiWhitelisted"
                  onCheckedChange={handleChange}
                  value={values.taxiWhitelisted}
                />
              </SettingsFormField>

              <SettingsFormField
                errorMessage={errors.businessWhitelisted}
                action="checkbox"
                label="Business Whitelist"
                description="Businesses will be whitelisted, they will need to be reviewed, they can be accepted or denied before they can be used."
              >
                <Toggle
                  name="businessWhitelisted"
                  onCheckedChange={handleChange}
                  value={values.businessWhitelisted}
                />
              </SettingsFormField>
            </section>

            <Button disabled={state === "loading"} className="flex items-center" type="submit">
              {state === "loading" ? <Loader className="mr-3" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </TabsContent>
  );
}
