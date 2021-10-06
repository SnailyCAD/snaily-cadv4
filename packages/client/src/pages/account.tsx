import Head from "next/head";
import { Layout } from "components/Layout";
import { Formik } from "formik";
import { useAuth } from "src/context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Error } from "components/form/Error";
import { TabsContainer } from "components/tabs/TabsContainer";
import { Tab } from "@headlessui/react";

const TABS_TITLES = ["Account Info", "Account Settings"];

export default function Account() {
  const { user } = useAuth();

  const INITIAL_VALUES = {
    username: user?.username ?? "",
  };

  async function onSubmit(data: typeof INITIAL_VALUES) {
    console.log({ data });
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Account - SnailyCAD</title>
      </Head>

      <h1 className="text-3xl font-semibold mb-3">Account</h1>

      <TabsContainer tabs={TABS_TITLES}>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="bg-white rounded-xl p-3">
            <h3 className="text-2xl font-semibold">Account Info</h3>

            <div>
              {Object.entries(user).map(([key, value]) => {
                return (
                  <p>
                    <span className="capitalize font-semibold">{key}: </span> {String(value)}
                  </p>
                );
              })}
            </div>
          </Tab.Panel>

          <Tab.Panel className="bg-white rounded-xl p-3">
            <h3 className="text-2xl font-semibold">Account Settings</h3>

            <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
              {({ handleSubmit, handleChange, values, errors }) => (
                <form className="max-w-xl mt-2" onSubmit={handleSubmit}>
                  <FormField label="Username">
                    <Input
                      hasError={!!errors.username}
                      value={values.username}
                      onChange={handleChange}
                      name="username"
                    />
                    <Error>{errors.username} </Error>
                  </FormField>
                </form>
              )}
            </Formik>
          </Tab.Panel>
        </Tab.Panels>
      </TabsContainer>
    </Layout>
  );
}
