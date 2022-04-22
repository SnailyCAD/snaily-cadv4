import { Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import { TEMP_PASSWORD_SCHEMA } from "@snailycad/schemas";
import { useTranslations } from "use-intl";

import useFetch from "lib/useFetch";

import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import { getSessionUser } from "lib/auth";
import { useAuth } from "context/AuthContext";
import { Title } from "components/shared/Title";

const INITIAL_VALUES = {
  newPassword: "",
  confirmPassword: "",
};

export default function TempPassword() {
  const router = useRouter();
  const { state, execute } = useFetch();
  const { user, cad } = useAuth();

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
      <Title renderLayoutTitle={false}>{t("changePassword")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleSubmit, handleChange, errors, isValid }) => (
            <form
              className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-2"
              onSubmit={handleSubmit}
            >
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                {t("changePassword")}
              </h1>

              <p className="my-3 text-base text-gray-800 dark:text-white italic">
                {t("savePasswordInfo")}
              </p>

              <FormField errorMessage={errors.newPassword} label={t("password")}>
                <PasswordInput name="newPassword" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.confirmPassword} label={t("confirmPassword")}>
                <PasswordInput name="confirmPassword" onChange={handleChange} />
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
        {cad?.version ? (
          <p className="text-gray-900 dark:text-gray-200 block mt-3 text-base">v{cad.version}</p>
        ) : null}
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
