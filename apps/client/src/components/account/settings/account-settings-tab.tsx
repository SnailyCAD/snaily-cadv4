import { useTranslations } from "use-intl";
import { Form, Formik, type FormikHelpers } from "formik";
import { CHANGE_USER_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { Loader, Button, TextField, TabsContent } from "@snailycad/ui";
import { ChangePasswordArea } from "./change-password-area";
import { Manage2FAModal } from "../2fa/manage-2fa-modal";
import { TwoFactorAuthArea } from "../2fa/two-factor-auth-area";
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
      data: { ...user, ...data },
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
              autoComplete="username"
              label={t("Auth.username")}
              errorMessage={errors.username}
              defaultValue={values.username}
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
