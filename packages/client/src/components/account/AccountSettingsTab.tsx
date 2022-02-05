import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Form, Formik, FormikHelpers } from "formik";

import { useAuth } from "src/context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import useFetch from "lib/useFetch";
import { Button } from "components/Button";
import { ChangePasswordArea } from "components/account/ChangePasswordArea";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { Manage2FAModal } from "./2fa/Manage2FAModal";

export function AccountSettingsTab() {
  const { user } = useAuth();
  const t = useTranslations("Account");
  const { execute, state } = useFetch();
  const common = useTranslations("Common");
  const { openModal } = useModal();

  const INITIAL_VALUES = {
    username: user?.username ?? "",
    discordId: user?.discordId ?? "",
  };

  async function onSubmit(
    data: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    await execute("/user", {
      method: "PATCH",
      data,
      helpers,
    });
  }

  return (
    <TabsContent aria-label={t("accountSettings")} value="accountSettings">
      <h3 className="text-2xl font-semibold">{t("accountSettings")}</h3>
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form className="mt-2">
            <FormField label="Username" errorMessage={errors.username}>
              <Input value={values.username} onChange={handleChange} name="username" />
            </FormField>

            <FormField optional label="Discord ID" errorMessage={errors.discordId}>
              <Input value={values.discordId} onChange={handleChange} name="discordId" />
            </FormField>

            <Button
              variant={user?.twoFactorEnabled ? "danger" : "default"}
              className="mr-2"
              type="button"
              onClick={() => openModal(ModalIds.Manage2FA, !!user?.twoFactorEnabled)}
            >
              {user?.twoFactorEnabled ? t("disable2FA") : t("enable2FA")}
            </Button>
            <Button type="submit" disabled={state === "loading"}>
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>

      <ChangePasswordArea />
      <Manage2FAModal />
    </TabsContent>
  );
}
