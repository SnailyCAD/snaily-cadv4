import { CHANGE_PASSWORD_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/Input";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";

export const ChangePasswordArea = () => {
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

    const { json } = await execute("/user/password", {
      method: "POST",
      data: values,
    });

    if (typeof json === "boolean") {
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
    <section className="mt-5">
      <h3 className="text-2xl font-semibold">{t("passwordSettings")}</h3>
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form className="mt-2">
            <FormField label={t("currentPassword")}>
              <PasswordInput
                hasError={!!errors.currentPassword}
                value={values.currentPassword}
                onChange={handleChange}
                name="currentPassword"
              />
              <Error>{errors.currentPassword}</Error>
            </FormField>

            <FormField label={t("newPassword")}>
              <PasswordInput
                hasError={!!errors.newPassword}
                value={values.newPassword}
                onChange={handleChange}
                name="newPassword"
              />
              <Error>{errors.currentPassword}</Error>
            </FormField>

            <FormField label={t("confirmNewPassword")}>
              <PasswordInput
                hasError={!!errors.confirmPassword}
                value={values.confirmPassword}
                onChange={handleChange}
                name="confirmPassword"
              />
              <Error>{errors.confirmPassword}</Error>
            </FormField>

            <Button type="submit" disabled={state === "loading"}>
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </section>
  );
};
