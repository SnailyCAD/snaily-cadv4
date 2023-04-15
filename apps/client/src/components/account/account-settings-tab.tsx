import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";
import { CHANGE_USER_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Loader, Button, TextField, TabsContent } from "@snailycad/ui";
import { ChangePasswordArea } from "components/account/ChangePasswordArea";
import { Manage2FAModal } from "./2fa/Manage2FAModal";
import { TwoFactorAuthArea } from "./2fa/TwoFactorAuthArea";
import { handleValidate } from "lib/handleValidate";
import type { PatchUserData } from "@snailycad/types/api";

export function AccountSettingsTab() {
  const { user, setUser } = useAuth();
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
    if (!user) return;

    const { json } = await execute<PatchUserData, typeof INITIAL_VALUES>({
      path: "/user",
      method: "PATCH",
      data: { ...(user ?? {}), ...data },
      helpers,
    });

    if (json) {
      setUser({ ...user, ...json });
    }
  }

  return (
    <TabsContent aria-label={t("Account.accountSettings")} value="accountSettings">
      <h1 className="text-2xl font-semibold">{t("Account.accountSettings")}</h1>
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form className="mt-2">
            <TextField
              label={t("Auth.username")}
              errorMessage={errors.username}
              defaultValue={values.username}
              name="username"
              onChange={(value) => setFieldValue("username", value)}
            />

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
