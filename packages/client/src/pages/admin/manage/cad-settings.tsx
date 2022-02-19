import * as React from "react";
import { useAuth } from "context/AuthContext";
import { Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { useTranslations } from "use-intl";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Formik, FormikHelpers } from "formik";
import { Input, PasswordInput } from "components/form/inputs/Input";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { TabList, TabsContent } from "components/shared/TabList";
import { requestAll } from "lib/utils";
import { handleValidate } from "lib/handleValidate";
import { CAD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { Title } from "components/shared/Title";
import dynamic from "next/dynamic";
import { DiscordRolesTab } from "components/admin/manage/cad-settings/DiscordRolesTab";
import { SettingsFormField } from "components/form/SettingsFormField";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

const MiscFeatures = dynamic(
  async () => (await import("components/admin/manage/cad-settings/MiscFeatures")).MiscFeatures,
);

const DisabledFeaturesArea = dynamic(
  async () =>
    (await import("components/admin/manage/cad-settings/DisabledFeatures")).DisabledFeaturesArea,
);

const ApiTokenTab = dynamic(
  async () => (await import("components/admin/manage/cad-settings/ApiTokenTab")).ApiTokenTab,
);

const AutoSetUserPropertiesTab = dynamic(
  async () =>
    (await import("components/admin/manage/cad-settings/AutoSetUserPropertiesTab"))
      .AutoSetUserPropertiesTab,
);

export default function CadSettings() {
  const [logo, setLogo] = React.useState<(File | string) | null>(null);
  const { state, execute } = useFetch();
  const { user, cad, setCad } = useAuth();
  const { AOP } = useFeatureEnabled();

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  const SETTINGS_TABS = [
    { name: t("GENERAL_SETTINGS"), value: "GENERAL_SETTINGS" },
    { name: t("FEATURES"), value: "FEATURES" },
    { name: t("MISC_SETTINGS"), value: "MISC_SETTINGS" },
    { name: "Auto set user properties", value: "AUTO_SET_PROPERTIES" },
    { name: "Api Token", value: "API_TOKEN" },
    { name: "Discord Roles", value: "DISCORD_ROLES_TAB" },
  ];

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();
    const validatedImage = validateFile(logo, helpers);

    if (validatedImage) {
      if (typeof validatedImage === "object") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    const { json } = await execute("/admin/manage/cad-settings", {
      method: "PUT",
      data: values,
      helpers,
    });

    if (json?.id) {
      if (validatedImage && typeof validatedImage === "object") {
        const {
          json: { logoId },
        } = await execute("/admin/manage/cad-settings/image", {
          method: "POST",
          data: fd,
          helpers,
        });

        json.logoId = logoId;
      }

      setCad({ ...cad, ...json });
    }
  }

  if (user?.rank !== Rank.OWNER) {
    return null;
  }

  if (!cad) {
    return null;
  }

  const validate = handleValidate(CAD_SETTINGS_SCHEMA);
  const INITIAL_VALUES = {
    name: cad.name ?? "",
    areaOfPlay: cad.areaOfPlay ?? "",
    steamApiKey: cad.steamApiKey ?? "",
    discordWebhookURL: cad.discordWebhookURL ?? "",
    towWhitelisted: cad.towWhitelisted ?? false,
    taxiWhitelisted: cad.taxiWhitelisted ?? false,
    whitelisted: cad.whitelisted ?? false,
    businessWhitelisted: cad.businessWhitelisted ?? false,
    registrationCode: cad.registrationCode ?? "",
    roleplayEnabled: cad.miscCadSettings?.roleplayEnabled ?? true,
    logoId: cad.logoId ?? "",
  };

  return (
    <AdminLayout>
      <Title>{t("MANAGE_CAD_SETTINGS")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">{t("MANAGE_CAD_SETTINGS")}</h1>

      <TabList tabs={SETTINGS_TABS}>
        <TabsContent value="GENERAL_SETTINGS">
          <h2 className="text-2xl font-semibold">General Settings</h2>

          <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
            {({ handleSubmit, handleChange, values, errors }) => (
              <form autoComplete="off" className="mt-3" onSubmit={handleSubmit}>
                <div>
                  <ImageSelectInput label="CAD Logo" image={logo} setImage={setLogo} />
                  <small className="block text-[15px] -mt-2 mb-3">
                    <b>Note:</b> page reload may be required.
                  </small>
                </div>

                <SettingsFormField
                  errorMessage={errors.name}
                  action="input"
                  label="CAD Name"
                  description="The name to the CAD. This can be the name of your community, etc."
                >
                  <Input onChange={handleChange} value={values.name} name="name" />
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
                  errorMessage={errors.discordWebhookURL}
                  action="input"
                  label="Discord Webhook URL"
                  description="Events will be sent to this webhook channel. (911 calls, unit status updates)"
                >
                  <PasswordInput
                    onChange={handleChange}
                    value={values.discordWebhookURL}
                    name="discordWebhookURL"
                    autoComplete="off"
                  />
                </SettingsFormField>

                <SettingsFormField
                  optional
                  errorMessage={errors.registrationCode}
                  action="input"
                  label="Registration Code"
                  description="Users will need to enter this code when creating an account."
                >
                  <PasswordInput
                    onChange={handleChange}
                    value={values.registrationCode}
                    name="registrationCode"
                    autoComplete="off"
                  />
                </SettingsFormField>

                <SettingsFormField
                  errorMessage={errors.whitelisted}
                  action="checkbox"
                  label="CAD Whitelist"
                  description="The CAD will be whitelisted. Any user that registers will need to be reviewed, they can be accepted or denied"
                >
                  <Toggle name="whitelisted" onClick={handleChange} toggled={values.whitelisted} />
                </SettingsFormField>

                <SettingsFormField
                  errorMessage={errors.towWhitelisted}
                  action="checkbox"
                  label="Tow Whitelist"
                  description="Tow will be whitelisted, the permission can be given to any user."
                >
                  <Toggle
                    name="towWhitelisted"
                    onClick={handleChange}
                    toggled={values.towWhitelisted}
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
                    onClick={handleChange}
                    toggled={values.taxiWhitelisted}
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
                    onClick={handleChange}
                    toggled={values.businessWhitelisted}
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
                    onClick={handleChange}
                    toggled={values.roleplayEnabled}
                  />
                </SettingsFormField>

                <Button disabled={state === "loading"} className="flex items-center" type="submit">
                  {state === "loading" ? <Loader className="mr-3" /> : null}
                  {common("save")}
                </Button>
              </form>
            )}
          </Formik>
        </TabsContent>

        <TabsContent aria-label={t("FEATURES")} value="FEATURES">
          <DisabledFeaturesArea />
        </TabsContent>

        <TabsContent aria-label={t("MISC_SETTINGS")} value="MISC_SETTINGS">
          <MiscFeatures />
        </TabsContent>

        <TabsContent aria-label="Auto set user properties" value="AUTO_SET_PROPERTIES">
          <AutoSetUserPropertiesTab />
        </TabsContent>

        <ApiTokenTab />
        <DiscordRolesTab />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [["/admin/manage/cad-settings", []]]);

  return {
    props: {
      citizens: data,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
