import * as React from "react";
import { useAuth } from "context/AuthContext";
import { rank } from "types/prisma";
import { AdminLayout } from "components/admin/AdminLayout";
import { useTranslations } from "use-intl";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Formik, FormikHelpers } from "formik";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/inputs/Input";
import { FormRow } from "components/form/FormRow";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { DisabledFeaturesArea } from "components/admin/manage/cad-settings/DisabledFeatures";
import { TabList } from "components/shared/TabList";
import { Tab } from "@headlessui/react";
import { MiscFeatures } from "components/admin/manage/cad-settings/MiscFeatures";
import { requestAll } from "lib/utils";
import { ApiTokenTab } from "components/admin/manage/cad-settings/ApiTokenTab";
import { handleValidate } from "lib/handleValidate";
import { CAD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { Title } from "components/shared/Title";

export default function CadSettings() {
  const [logo, setLogo] = React.useState<(File | string) | null>(null);
  const { state, execute } = useFetch();
  const { user, cad, setCad } = useAuth();

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  const SETTINGS_TABS = [t("GENERAL_SETTINGS"), t("FEATURES"), t("MISC_SETTINGS"), "Api Token"];

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
    });

    if (json?.id) {
      if (validatedImage && typeof validatedImage === "object") {
        const {
          json: { logoId },
        } = await execute("/admin/manage/cad-settings/image", {
          method: "POST",
          data: fd,
        });

        json.logoId = logoId;
      }

      setCad({ ...cad, ...json });
    }
  }

  if (user?.rank !== rank.OWNER) {
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
    whitelisted: cad.whitelisted ?? false,
    businessWhitelisted: cad.businessWhitelisted ?? false,
    registrationCode: cad.registrationCode ?? "",
    roleplayEnabled: cad.miscCadSettings?.roleplayEnabled ?? true,
    logoId: cad.logoId ?? "",
  };

  return (
    <AdminLayout className="dark:text-white">
      <Title>{t("MANAGE_CAD_SETTINGS")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">{t("MANAGE_CAD_SETTINGS")}</h1>

      <TabList tabs={SETTINGS_TABS}>
        <Tab.Panel className="mt-3">
          <h2 className="text-2xl font-semibold">General Settings</h2>

          <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
            {({ handleSubmit, handleChange, values, errors }) => (
              <form className="mt-3" onSubmit={handleSubmit}>
                <div>
                  <ImageSelectInput label="CAD Logo" image={logo} setImage={setLogo} />
                  <small className="block text-[15px] -mt-2 mb-3">
                    <b>Note:</b> page reload may be required.
                  </small>
                </div>

                <FormField errorMessage={errors.name} label="CAD Name">
                  <Input onChange={handleChange} value={values.name} name="name" />
                </FormField>

                <FormField errorMessage={errors.areaOfPlay} label="Area of Play">
                  <Input onChange={handleChange} value={values.areaOfPlay} name="areaOfPlay" />
                </FormField>

                <FormField optional errorMessage={errors.steamApiKey} label="Steam API Key">
                  <PasswordInput
                    onChange={handleChange}
                    value={values.steamApiKey}
                    name="steamApiKey"
                  />
                </FormField>

                <FormField
                  optional
                  errorMessage={errors.discordWebhookURL}
                  label="Discord webhook URL"
                >
                  <PasswordInput
                    onChange={handleChange}
                    value={values.discordWebhookURL}
                    name="discordWebhookURL"
                  />
                </FormField>

                <FormField
                  optional
                  errorMessage={errors.registrationCode}
                  label="Registration Code"
                >
                  <PasswordInput
                    onChange={handleChange}
                    value={values.registrationCode}
                    name="registrationCode"
                  />
                </FormField>

                <FormRow>
                  <FormField errorMessage={errors.towWhitelisted} label="Tow Whitelisted">
                    <Toggle
                      name="towWhitelisted"
                      onClick={handleChange}
                      toggled={values.towWhitelisted}
                    />
                  </FormField>

                  <FormField errorMessage={errors.whitelisted} label="CAD Whitelisted">
                    <Toggle
                      name="whitelisted"
                      onClick={handleChange}
                      toggled={values.whitelisted}
                    />
                  </FormField>

                  <FormField errorMessage={errors.businessWhitelisted} label="Business Whitelisted">
                    <Toggle
                      name="businessWhitelisted"
                      onClick={handleChange}
                      toggled={values.businessWhitelisted}
                    />
                  </FormField>
                </FormRow>

                <FormField errorMessage={errors.roleplayEnabled} label="Roleplay enabled">
                  <Toggle
                    name="roleplayEnabled"
                    onClick={handleChange}
                    toggled={values.roleplayEnabled}
                  />
                  <small className="mt-1 text-sm">
                    When disabled, this will add a banner that says that roleplay must be stopped.
                  </small>
                </FormField>

                <Button disabled={state === "loading"} className="flex items-center" type="submit">
                  {state === "loading" ? <Loader className="mr-3" /> : null}
                  {common("save")}
                </Button>
              </form>
            )}
          </Formik>
        </Tab.Panel>

        <Tab.Panel>
          <DisabledFeaturesArea />
        </Tab.Panel>

        <Tab.Panel>
          <MiscFeatures />
        </Tab.Panel>

        <ApiTokenTab />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [["/admin/manage/cad-settings", []]]);

  return {
    props: {
      citizens: data,
      session: await getSessionUser(req, req.cookies?.["snaily-cad-session"]),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
