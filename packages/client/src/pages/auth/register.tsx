import * as React from "react";
import { Form, Formik, FormikHelpers } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import { useTranslations } from "use-intl";

import useFetch from "lib/useFetch";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import type { cad } from "@snailycad/types";
import { handleRequest } from "lib/fetch";
import { Title } from "components/shared/Title";
import { AuthScreenImages } from "components/auth/AuthScreenImages";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { LocalhostDetector } from "components/auth/LocalhostDetector";

const INITIAL_VALUES = {
  username: "",
  password: "",
  confirmPassword: "",
  registrationCode: "",
};

interface Props {
  cad: Pick<cad, "registrationCode" | "version">;
}

export default function Register({ cad }: Props) {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");
  const { ALLOW_REGULAR_LOGIN } = useFeatureEnabled();
  const validate = handleValidate(AUTH_SCHEMA);

  React.useEffect(() => {
    if (!ALLOW_REGULAR_LOGIN) {
      router.push("/auth/login");
    }
  }, [ALLOW_REGULAR_LOGIN, router]);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (values.confirmPassword !== values.password) {
      return helpers.setFieldError("confirmPassword", "Passwords do not match");
    }

    const { json } = await execute("/auth/register", {
      data: values,
      method: "POST",
      helpers,
    });

    if (process.env.IFRAME_SUPPORT_ENABLED === "true" && json.session) {
      await fetch("/api/token", {
        method: "POST",
        body: json.session,
      });
    }

    if (json.isOwner) {
      router.push("/admin/manage/cad-settings");
    } else if (json.userId) {
      router.push("/citizen");
    }
  }

  if (!ALLOW_REGULAR_LOGIN) {
    return (
      <div className="fixed inset-0 grid bg-transparent place-items-center">
        <Title renderLayoutTitle={false}>{t("login")}</Title>

        <span aria-label="loading...">
          <Loader className="w-14 h-14 border-[3px]" />
        </span>
      </div>
    );
  }

  return (
    <>
      <Title renderLayoutTitle={false}>{t("register")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <AuthScreenImages />
        <LocalhostDetector />

        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, errors, isValid }) => (
            <Form className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-2 z-10">
              <h1 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
                {t("register")}
              </h1>

              <FormField errorMessage={errors.username} label={t("username")}>
                <Input type="text" name="username" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.password} label={t("password")}>
                <PasswordInput name="password" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.confirmPassword} label={t("confirmPassword")}>
                <PasswordInput name="confirmPassword" onChange={handleChange} />
              </FormField>

              {cad.registrationCode ? (
                <FormField errorMessage={errors.registrationCode} label={t("registrationCode")}>
                  <Input name="registrationCode" onChange={handleChange} />
                </FormField>
              ) : null}

              <div className="mt-3">
                <Link href="/auth/login">
                  <a href="/auth/login" className="inline-block mb-3 underline dark:text-white">
                    {t("hasAccount")}
                  </a>
                </Link>

                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="flex items-center justify-center w-full py-1.5"
                >
                  {state === "loading" ? <Loader className="mr-3" /> : null} {t("register")}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
        {cad.version ? (
          <p className="text-gray-900 dark:text-gray-200 block mt-3 text-base">
            v{cad.version.currentVersion} - {cad.version.currentCommitHash}
          </p>
        ) : null}
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
