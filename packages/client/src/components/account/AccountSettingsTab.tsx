import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";
import { CHANGE_USER_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import useFetch from "lib/useFetch";
import { Button } from "components/Button";
import { ChangePasswordArea } from "components/account/ChangePasswordArea";
import { Manage2FAModal } from "./2fa/Manage2FAModal";
import { Loader } from "components/Loader";
import { TwoFactorAuthArea } from "./2fa/TwoFactorAuthArea";
import { handleValidate } from "lib/handleValidate";

export function AccountSettingsTab() {
  const { user } = useAuth();
  const t = useTranslations();
  const { execute, state } = useFetch();
  const common = useTranslations("Common");

  const INITIAL_VALUES = {
    ...(user ?? {}),
    username: user?.username ?? "",
  };

  const validate = handleValidate(CHANGE_USER_SCHEMA);
  async function onSubmit(
    data: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    await execute("/user", {
      method: "PATCH",
      data: { ...(user ?? {}), ...data },
      helpers,
    });
  }

  return (
    <TabsContent aria-label={t("Account.accountSettings")} value="accountSettings">
      <h3 className="text-2xl font-semibold">{t("Account.accountSettings")}</h3>
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form className="mt-2">
            <FormField label={t("Auth.username")} errorMessage={errors.username}>
              <Input value={values.username} onChange={handleChange} name="username" />
            </FormField>

            <div className="flex items-center gap-2">
              <Button
                className="flex items-center gap-2"
                type="submit"
                disabled={state === "loading"}
              >
                {state === "loading" ? <Loader /> : null}
                {common("save")}
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      <TwoFactorAuthArea />
      <ChangePasswordArea />
      <Manage2FAModal />
    </TabsContent>
  );
}
