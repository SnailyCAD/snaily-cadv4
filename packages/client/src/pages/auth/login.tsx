import { Formik } from "formik";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";

import useFetch from "lib/useFetch";

import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import { useTranslations } from "use-intl";
import { GetStaticProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";

const INITIAL_VALUES = {
  username: "",
  password: "",
};

export default function Login() {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");
  const error = useTranslations("Errors");

  const authMessages = {
    banned: error("userBanned"),
    deleted: error("userDeleted"),
  } as const;

  const errorMessage = authMessages[router.query.error as keyof typeof authMessages];

  const validate = handleValidate(AUTH_SCHEMA);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/auth/login", {
      data: values,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (json.hasTempPassword) {
      router.push({
        pathname: "/auth/temp-password",
        query: { tp: values.password },
      });
    } else if (json?.userId) {
      router.push("/citizen");
    }
  }

  return (
    <>
      <Head>
        <title>Login - SnailyCAD</title>
      </Head>

      <main className="flex justify-center pt-20">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleSubmit, handleChange, errors, isValid }) => (
            <form
              className="rounded-lg p-6 w-full max-w-md bg-gray-100 dark:bg-dark-gray shadow-md"
              onSubmit={handleSubmit}
            >
              <h1 className="text-2xl text-gray-800 dark:text-white font-semibold mb-3">
                {t("login")}
              </h1>

              {errorMessage ? (
                <p className="bg-red-500/80 text-black w-full py-1.5 px-3 my-3 rounded-md">
                  {errorMessage}
                </p>
              ) : null}

              <FormField fieldId="username" label={t("username")}>
                <Input
                  hasError={!!errors.username}
                  id="username"
                  type="text"
                  name="username"
                  onChange={handleChange}
                />
                <Error>{errors.username}</Error>
              </FormField>

              <FormField fieldId="password" label={t("password")}>
                <PasswordInput
                  hasError={!!errors.password}
                  id="password"
                  name="password"
                  onChange={handleChange}
                />
                <Error>{errors.password}</Error>
              </FormField>

              <div className="mt-3">
                <Link href="/auth/register">
                  <a className="underline inline-block mb-3 dark:text-gray-200">{t("noAccount")}</a>
                </Link>

                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 dark:bg-dark-bg"
                >
                  {state === "loading" ? <Loader /> : null} {t("login")}
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      messages: await getTranslations(["auth"], locale),
    },
  };
};
