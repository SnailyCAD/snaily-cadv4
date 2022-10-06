import { CHANGE_PASSWORD_SCHEMA } from "@snailycad/schemas";
import type { PostUserPasswordData } from "@snailycad/types/api";
import { Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/inputs/Input";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";

export function ChangePasswordArea() {
  const t = useTranslations("Account");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (values.confirmPassword !== values.newPassword) {
      helpers.setFieldError("confirmPassword", "Passwords do not match");
      return;
    }

    const { json } = await execute<PostUserPasswordData, typeof INITIAL_VALUES>({
      path: "/user/password",
      method: "POST",
      data: { ...values, currentPassword: values.currentPassword || null },
      helpers,
    });

    if (typeof json === "boolean" && json) {
      toast.success("Successfully saved.");
    }
  }

  const validate = handleValidate(CHANGE_PASSWORD_SCHEMA);
  const INITIAL_VALUES = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  return (
    <section className="mt-7">
      <h2 className="text-2xl font-semibold">{t("passwordSettings")}</h2>
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form className="mt-2">
            <FormField errorMessage={errors.currentPassword} label={t("currentPassword")}>
              <PasswordInput
                value={values.currentPassword}
                onChange={handleChange}
                name="currentPassword"
              />
            </FormField>

            <FormField errorMessage={errors.newPassword} label={t("newPassword")}>
              <PasswordInput
                value={values.newPassword}
                onChange={handleChange}
                name="newPassword"
              />
            </FormField>

            <FormField errorMessage={errors.confirmPassword} label={t("confirmNewPassword")}>
              <PasswordInput
                value={values.confirmPassword}
                onChange={handleChange}
                name="confirmPassword"
              />
            </FormField>

            <Button type="submit" disabled={state === "loading"}>
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </section>
  );
}
