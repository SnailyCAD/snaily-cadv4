import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { useAuth } from "context/AuthContext";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/inputs/Input";
import { FormRow } from "components/form/FormRow";
import { Button } from "components/Button";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { ManagePermissionsModal } from "components/admin/manage/users/ManagePermissionsModal";

export function AccountInfoTab() {
  const { user } = useAuth();
  const t = useTranslations();
  const { openModal } = useModal();

  const INITIAL_VALUES = {
    ...(user ?? {}),
    username: user?.username ?? "",
  };

  function handleViewPermissions() {
    openModal(ModalIds.ManagePermissions);
  }

  if (!user) {
    return null;
  }

  return (
    <TabsContent aria-label={t("Account.accountInfo")} value="accountInfo">
      <h3 className="text-2xl font-semibold">{t("Account.accountInfo")}</h3>
      <Formik onSubmit={() => void 0} initialValues={INITIAL_VALUES}>
        {({ values, errors }) => (
          <Form className="mt-2">
            <FormRow>
              <FormField label="Account id" errorMessage={errors.id}>
                <PasswordInput disabled defaultValue={values.id} name="id" />
              </FormField>

              <FormField label={t("Auth.username")} errorMessage={errors.username}>
                <Input disabled defaultValue={values.username} name="username" />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Discord id" errorMessage={errors.discordId}>
                <Input disabled defaultValue={String(values.discordId)} name="discordId" />
              </FormField>

              <FormField label="Steam id" errorMessage={errors.steamId}>
                <Input disabled defaultValue={String(values.steamId)} name="steamId" />
              </FormField>
            </FormRow>

            <Button onClick={handleViewPermissions} className="mt-4">
              {t("Account.viewMyPermissions")}
            </Button>

            <ManagePermissionsModal isReadOnly user={user} />
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}
