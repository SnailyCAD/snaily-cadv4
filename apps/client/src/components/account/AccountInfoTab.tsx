import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { useAuth } from "context/AuthContext";
import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/inputs/Input";
import { FormRow } from "components/form/FormRow";
import { Button, TextField } from "@snailycad/ui";
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
      <h1 className="text-2xl font-semibold">{t("Account.accountInfo")}</h1>
      <Formik onSubmit={() => void 0} initialValues={INITIAL_VALUES}>
        {({ values, errors }) => (
          <Form className="mt-2">
            <FormRow>
              <FormField label="Account id" errorMessage={errors.id}>
                <PasswordInput disabled defaultValue={values.id} name="id" />
              </FormField>

              <TextField
                label={t("Auth.username")}
                errorMessage={errors.username}
                isDisabled
                isReadOnly
                defaultValue={values.username}
                name="username"
              />
            </FormRow>

            <FormRow>
              <TextField
                label="Discord Id"
                errorMessage={errors.discordId}
                isDisabled
                isReadOnly
                defaultValue={String(values.discordId)}
                name="discordId"
              />

              <TextField
                label="Steam Id"
                errorMessage={errors.steamId}
                isDisabled
                isReadOnly
                defaultValue={String(values.steamId)}
                name="steamId"
              />
            </FormRow>

            <Button onPress={handleViewPermissions} className="mt-4">
              {t("Account.viewMyPermissions")}
            </Button>

            <ManagePermissionsModal isReadOnly user={user} />
          </Form>
        )}
      </Formik>
    </TabsContent>
  );
}
