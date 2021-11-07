import { Tab } from "@headlessui/react";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";

import { useAuth } from "src/context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Error } from "components/form/Error";
import useFetch from "lib/useFetch";
import { Button } from "components/Button";
import { ChangePasswordArea } from "components/account/ChangePasswordArea";

export const AccountSettingsTab = () => {
  const { user } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");

  const INITIAL_VALUES = {
    username: user?.username ?? "",
  };

  async function onSubmit(data: typeof INITIAL_VALUES) {
    await execute("/user", {
      method: "PATCH",
      data,
    });
  }

  return (
    <Tab.Panel>
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
