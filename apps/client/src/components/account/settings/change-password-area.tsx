import { CHANGE_PASSWORD_SCHEMA } from "@snailycad/schemas";
import type { PostUserPasswordData } from "@snailycad/types/api";
import { Button, TextField } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";

export function ChangePasswordArea() {
  const t = useTranslations("Account");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { user } = useAuth();

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
            <input
              type="text"
              autoComplete="username"
              name="username"
              defaultValue={user?.username}
              className="sr-only"
            />

            <TextField
              type="password"
              name="current-password"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={(value) => setFieldValue("currentPassword", value)}
              errorMessage={errors.currentPassword}
              label={t("currentPassword")}
            />

            <TextField
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={(value) => setFieldValue("newPassword", value)}
              errorMessage={errors.newPassword}
              label={t("newPassword")}
            />

            <TextField
              type="password"
              name="confirm-password"
              autoComplete="new-password"
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
