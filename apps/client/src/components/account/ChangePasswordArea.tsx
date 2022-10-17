import { CHANGE_PASSWORD_SCHEMA } from "@snailycad/schemas";
import type { PostUserPasswordData } from "@snailycad/types/api";
import { Button, TextField } from "@snailycad/ui";
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
        {({ setFieldValue, values, errors }) => (
          <Form className="mt-2">
            <TextField
              type="password"
              name="currentPassword"
              value={values.currentPassword}
              onChange={(value) => setFieldValue("currentPassword", value)}
              errorMessage={errors.currentPassword}
              label={t("currentPassword")}
            />

            <TextField
              type="password"
              name="newPassword"
              value={values.newPassword}
              onChange={(value) => setFieldValue("newPassword", value)}
              errorMessage={errors.newPassword}
              label={t("newPassword")}
            />

            <TextField
              type="password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={(value) => setFieldValue("confirmPassword", value)}
              errorMessage={errors.confirmPassword}
              label={t("confirmNewPassword")}
            />

            <Button type="submit" disabled={state === "loading"}>
              {common("save")}
            </Button>
          </Form>
        )}
      </Formik>
    </section>
  );
}
