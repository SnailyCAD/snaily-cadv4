import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import { TEMP_PASSWORD_SCHEMA } from "@snailycad/schemas";
import { useTranslations } from "use-intl";

import useFetch from "lib/useFetch";

import { handleValidate } from "lib/handleValidate";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button, Loader, TextField } from "@snailycad/ui";
import { getSessionUser } from "lib/auth";
import { useAuth } from "context/AuthContext";
import { Title } from "components/shared/Title";
import type { PostUserPasswordData } from "@snailycad/types/api";
import { VersionDisplay } from "components/shared/VersionDisplay";

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
    const { json } = await execute<PostUserPasswordData>({
      path: "/user/password",
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
          {({ setFieldValue, values, errors, isValid }) => (
            <Form className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-primary dark:border dark:border-secondary">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                {t("changePassword")}
              </h1>

              <p className="my-3 text-base text-gray-800 dark:text-white italic">
                {t("savePasswordInfo")}
              </p>

              <TextField
                type="password"
                name="newPassword"
                value={values.newPassword}
                onChange={(value) => setFieldValue("newPassword", value)}
                errorMessage={errors.newPassword}
                label={t("password")}
              />

              <TextField
                type="password"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={(value) => setFieldValue("confirmPassword", value)}
                errorMessage={errors.confirmPassword}
                label={t("confirmPassword")}
              />

              <div className="mt-3">
                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="flex items-center justify-center w-full py-1.5"
                >
                  {state === "loading" ? <Loader className="mr-3" /> : null} {common("save")}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
        <VersionDisplay cad={cad} />

        <a
          rel="noreferrer"
          target="_blank"
          className="mt-3 md:mt-0 relative md:absolute md:bottom-10 md:left-1/2 md:-translate-x-1/2 underline text-lg transition-colors text-neutral-700 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white mx-2 block cursor-pointer z-50"
          href="https://snailycad.org"
        >
          SnailyCAD
        </a>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  return {
    props: {
      session: user,
      messages: await getTranslations(["auth"], user?.locale ?? locale),
    },
  };
};
