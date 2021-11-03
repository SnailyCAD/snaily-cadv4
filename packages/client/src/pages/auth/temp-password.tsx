import { Formik, FormikHelpers } from "formik";
import Head from "next/head";
import { useRouter } from "next/router";
import { TEMP_PASSWORD_SCHEMA } from "@snailycad/schemas";
import { useTranslations } from "use-intl";

import useFetch from "lib/useFetch";

import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import { getSessionUser } from "lib/auth";
import { useAuth } from "context/AuthContext";

const INITIAL_VALUES = {
  newPassword: "",
  confirmPassword: "",
};

export default function TempPassword() {
  const router = useRouter();
  const { state, execute } = useFetch();
  const { user } = useAuth();

  const common = useTranslations("Common");
  const t = useTranslations("Auth");

  const validate = handleValidate(TEMP_PASSWORD_SCHEMA);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (values.confirmPassword !== values.newPassword) {
      return helpers.setFieldError("confirmPassword", "Passwords do not match");
    }

    const tempPassword = String(router.query.tp);
    const { json } = await execute("/user/password", {
      data: { ...values, currentPassword: tempPassword },
      method: "POST",
    });

    if (typeof json === "boolean") {
      router.push("/citizen");
    }
  }

  if (!user?.hasTempPassword) {
    return <main className="flex justify-center pt-20">Whoops</main>;
  }

  return (
    <>
      <Head>
        <title>{t("changePassword")} - SnailyCAD</title>
      </Head>

      <main className="flex justify-center pt-20">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleSubmit, handleChange, errors, isValid }) => (
            <form
              className="rounded-lg p-6 w-full max-w-md bg-gray-100 dark:bg-gray-2 shadow-md"
              onSubmit={handleSubmit}
            >
              <h1 className="text-2xl text-gray-800 dark:text-white font-semibold">
                {t("changePassword")}
              </h1>

              <p className="text-base italic my-3">{t("savePasswordInfo")}</p>

              <FormField fieldId="newPassword" label={t("password")}>
                <PasswordInput
                  hasError={!!errors.newPassword}
                  id="newPassword"
                  name="newPassword"
                  onChange={handleChange}
                />
                <Error>{errors.newPassword}</Error>
              </FormField>

              <FormField fieldId="confirmPassword" label={t("confirmPassword")}>
                <PasswordInput
                  hasError={!!errors.confirmPassword}
                  id="confirmPassword"
                  name="confirmPassword"
                  onChange={handleChange}
                />
                <Error>{errors.confirmPassword}</Error>
              </FormField>

              <div className="mt-3">
                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="flex items-center justify-center w-full py-1.5"
                >
                  {state === "loading" ? <Loader className="mr-3" /> : null} {common("save")}
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  return {
    props: {
      session: await getSessionUser(req),
      messages: await getTranslations(["auth"], locale),
    },
  };
};
