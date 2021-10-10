import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useRouter } from "next/router";
import { rank } from "types/prisma";
import { AdminLayout } from "components/admin/AdminLayout";
import { useTranslations } from "use-intl";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { handleRequest } from "lib/fetch";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { Formik } from "formik";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/Input";
import { Error } from "components/form/Error";
import { FormRow } from "components/form/FormRow";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";

export default function CadSettings() {
  const { state, execute } = useFetch();
  const { user, cad, setCad } = useAuth();
  const router = useRouter();

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/admin/manage/cad-settings", {
      method: "PUT",
      data: values,
    });

    if (json?.id) {
      setCad(json);
    }
  }

  React.useEffect(() => {
    if (user?.rank !== rank.OWNER) {
      // router.push("/403");
    }
  }, [user, router]);

  if (user?.rank !== rank.OWNER) {
    return null;
  }

  if (!cad) {
    return null;
  }

  const INITIAL_VALUES = {
    name: cad.name ?? "",
    areaOfPlay: cad.areaOfPlay ?? "",
    steamApiKey: cad.steamApiKey ?? "",
    towWhitelisted: cad.towWhitelisted ?? false,
    whitelisted: cad.whitelisted ?? false,
    registrationCode: cad.registrationCode ?? "",
  };

  return (
    <AdminLayout>
      <Head>
        <title>{t("MANAGE_CAD_SETTINGS")}</title>
      </Head>

      <h1 className="text-3xl font-semibold">{t("MANAGE_CAD_SETTINGS")}</h1>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors }) => (
          <form className="mt-3" onSubmit={handleSubmit}>
            <FormField label="CAD Name" fieldId="name">
              <Input onChange={handleChange} value={values.name} id="name" />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField label="Area of Play" fieldId="areaOfPlay">
              <Input onChange={handleChange} value={values.areaOfPlay} id="areaOfPlay" />
              <Error>{errors.areaOfPlay}</Error>
            </FormField>

            <FormField label="Steam API Key" fieldId="steamApiKey">
              <PasswordInput onChange={handleChange} value={values.steamApiKey} id="steamApiKey" />
              <Error>{errors.steamApiKey}</Error>
            </FormField>

            <FormField label="Registration Code" fieldId="registrationCode">
              <PasswordInput
                onChange={handleChange}
                value={values.registrationCode}
                id="registrationCode"
              />
              <Error>{errors.registrationCode}</Error>
            </FormField>

            <FormRow>
              <FormField label="Tow Whitelisted" fieldId="towWhitelisted">
                <Toggle
                  name="towWhitelisted"
                  onClick={handleChange}
                  toggled={values.towWhitelisted}
                />
                <Error>{errors.towWhitelisted}</Error>
              </FormField>

              <FormField label="CAD Whitelisted" fieldId="whitelisted">
                <Toggle name="whitelisted" onClick={handleChange} toggled={values.whitelisted} />
                <Error>{errors.whitelisted}</Error>
              </FormField>
            </FormRow>

            <Button disabled={state === "loading"} className="flex items-center" type="submit">
              {state === "loading" ? <Loader className="mr-3" /> : null}
              {common("save")}
            </Button>
          </form>
        )}
      </Formik>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const { data } = await handleRequest("/admin/manage/cad-settings", {
    headers: req.headers,
  }).catch(() => ({
    data: [],
  }));

  return {
    props: {
      citizens: data,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["admin", "common"], locale)),
      },
    },
  };
};
