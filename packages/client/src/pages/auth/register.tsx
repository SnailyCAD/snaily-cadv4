import { Formik, FormikHelpers } from "formik";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import { useTranslations } from "use-intl";

import useFetch from "lib/useFetch";

import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import type { cad } from "types/prisma";
import { handleRequest } from "lib/fetch";

const INITIAL_VALUES = {
  username: "",
  password: "",
  confirmPassword: "",
  registrationCode: "",
};

interface Props {
  cad: Pick<cad, "registrationCode">;
}

export default function Register({ cad }: Props) {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");

  const validate = handleValidate(AUTH_SCHEMA);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (values.confirmPassword !== values.password) {
      return helpers.setFieldError("confirmPassword", "Passwords do not match");
    }

    const data = await execute("/auth/register", {
      data: values,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    // todo: redirect to /admin/manage/cad-settings if "isNew"
    if (data.json?.userId) {
      router.push("/citizen");
    }
  }

  return (
    <>
      <Head>
        <title>{t("register")} - SnailyCAD</title>
      </Head>

      <main className="flex justify-center pt-20">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleSubmit, handleChange, errors, isValid }) => (
            <form className="rounded-lg p-6 w-full max-w-md bg-gray-100" onSubmit={handleSubmit}>
              <h1 className="text-2xl text-gray-800 font-semibold mb-3">{t("register")}</h1>

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

              <FormField fieldId="confirmPassword" label={t("confirmPassword")}>
                <PasswordInput
                  hasError={!!errors.confirmPassword}
                  id="confirmPassword"
                  name="confirmPassword"
                  onChange={handleChange}
                />
                <Error>{errors.confirmPassword}</Error>
              </FormField>

              {cad.registrationCode ? (
                <FormField fieldId="registrationCode" label={t("registrationCode")}>
                  <Input
                    hasError={!!errors.registrationCode}
                    id="registrationCode"
                    name="registrationCode"
                    onChange={handleChange}
                  />
                  <Error>{errors.registrationCode}</Error>
                </FormField>
              ) : null}

              <div className="mt-3">
                <Link href="/auth/login">
                  <a className="underline inline-block mb-3">{t("hasAccount")}</a>
                </Link>

                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="flex items-center justify-center w-full py-1.5"
                >
                  {state === "loading" ? <Loader className="mr-3" /> : null} {t("register")}
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data } = await handleRequest<cad | null>("/admin/manage/cad-settings").catch(() => ({
    data: null,
  }));

  return {
    props: {
      cad: data ?? {},
      messages: await getTranslations(["auth"], locale),
    },
  };
};
