import { Tab } from "@headlessui/react";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";

import { useAuth } from "src/context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Error } from "components/form/Error";
import useFetch from "lib/useFetch";
import { Toggle } from "components/form/Toggle";
import { Button } from "components/Button";
import { ChangePasswordArea } from "components/account/ChangePasswordArea";

export const AccountSettingsTab = () => {
  const { user } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");

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

  return (
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
              <Toggle toggled={values.isDarkTheme} onClick={handleChange} name="isDarkTheme" />
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
  );
};
