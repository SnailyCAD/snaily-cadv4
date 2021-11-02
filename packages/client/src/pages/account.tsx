import Head from "next/head";
import { Layout } from "components/Layout";
import { Tab } from "@headlessui/react";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";

import { useAuth } from "src/context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Error } from "components/form/Error";
import { TabsContainer } from "components/tabs/TabsContainer";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import { ChangePasswordArea } from "components/account/ChangePasswordArea";
import { AppearanceTab } from "components/account/AppearanceTab";

export default function Account() {
  const { user } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");

  const TABS_TITLES = [t("accountInfo"), t("accountSettings"), t("appearanceSettings")];

  const INITIAL_VALUES = {
    username: user?.username ?? "",
    isDarkTheme: user?.isDarkTheme ?? true,
  };

  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute("/user", {
      method: "PATCH",
      data,
    });

    console.log({ json });
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>{t("account")} - SnailyCAD</title>
      </Head>

      <div className="w-full flex justify-center">
        <div className="max-w-4xl w-full">
          <TabsContainer tabs={TABS_TITLES}>
            <Tab.Panels className="mt-2">
              <Tab.Panel className="bg-white rounded-xl p-3">
                <h3 className="text-2xl font-semibold">{t("accountInfo")}</h3>
                <div className="mt-2">
                  {Object.entries(user)
                    .filter(([k]) => k !== "cad")
                    .map(([key, value]) => {
                      return (
                        <p key={key}>
                          <span className="capitalize font-semibold">{key}: </span> {String(value)}
                        </p>
                      );
                    })}
                </div>
              </Tab.Panel>
              <Tab.Panel className="bg-white rounded-xl p-3">
                <h3 className="text-2xl font-semibold">{t("accountSettings")}</h3>
                <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
                  {({ handleChange, values, errors }) => (
                    <Form className="mt-2">
                      <FormField label="Username">
                        <Input
                          hasError={!!errors.username}
                          value={values.username}
                          onChange={handleChange}
                          name="username"
                        />
                        <Error>{errors.username}</Error>
                      </FormField>

                      <FormField label="Dark Theme">
                        <Toggle
                          toggled={values.isDarkTheme}
                          onClick={handleChange}
                          name="isDarkTheme"
                        />
                        <Error>{errors.isDarkTheme}</Error>
                      </FormField>

                      <Button type="submit" disabled={state === "loading"}>
                        {common("save")}
                      </Button>
                    </Form>
                  )}
                </Formik>

                <ChangePasswordArea />
              </Tab.Panel>
              <AppearanceTab />
            </Tab.Panels>
          </TabsContainer>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  return {
    props: {
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["account", "common"], locale)),
      },
    },
  };
};
