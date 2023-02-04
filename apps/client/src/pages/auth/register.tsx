import * as React from "react";
import { Form, Formik, FormikHelpers } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import { useTranslations } from "use-intl";

import useFetch from "lib/useFetch";
import { handleValidate } from "lib/handleValidate";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button, Loader, TextField } from "@snailycad/ui";
import { cad, WhitelistStatus } from "@snailycad/types";
import { handleRequest } from "lib/fetch";
import { Title } from "components/shared/Title";
import { AuthScreenImages } from "components/auth/AuthScreenImages";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { LocalhostDetector } from "components/auth/LocalhostDetector";
import { parseCookies } from "nookies";
import { VersionDisplay } from "components/shared/VersionDisplay";
import type { PostRegisterUserData } from "@snailycad/types/api";

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toastMessage } from "lib/toastMessage";

const INITIAL_VALUES = {
  username: "",
  password: "",
  confirmPassword: "",
  registrationCode: "",
};

interface Props {
  cad: Pick<cad, "registrationCode" | "version">;
}

const hasGoogleCaptchaSiteKey =
  typeof process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY.length > 0;

function Register({ cad }: Props) {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations();
  const { ALLOW_REGULAR_LOGIN } = useFeatureEnabled();
  const validate = handleValidate(AUTH_SCHEMA);
  const common = useTranslations();

  const { executeRecaptcha } = useGoogleReCaptcha();

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

    let captchaResult = null;
    if (hasGoogleCaptchaSiteKey) {
      captchaResult = await executeRecaptcha?.("registerUserAccount");
    }

    const { json } = await execute<PostRegisterUserData, typeof INITIAL_VALUES>({
      path: "/auth/register",
      data: { ...values, captchaResult },
      method: "POST",
      helpers,
      noToast: "whitelistPending",
    });

    if (json.whitelistStatus === WhitelistStatus.PENDING) {
      toastMessage({
        icon: "info",
        message: t("Errors.whitelistPending"),
        title: common("Common.information"),
        duration: Infinity,
      });

      router.push("/auth/pending");
      return;
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
        <Title renderLayoutTitle={false}>{t("Auth.login")}</Title>

        <span aria-label="loading...">
          <Loader className="w-14 h-14 border-[3px]" />
        </span>
      </div>
    );
  }

  return (
    <>
      <Title renderLayoutTitle={false}>{t("Auth.register")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <AuthScreenImages />
        <LocalhostDetector />

        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ setFieldValue, errors, isValid }) => (
            <Form className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-primary dark:border dark:border-secondary z-10">
              <header className="mb-3">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {t("Auth.register")}
                </h1>

                {ALLOW_REGULAR_LOGIN ? (
                  <Link
                    href="/auth/login"
                    className="inline-block mt-2 underline text-neutral-700 dark:text-gray-200"
                  >
                    {t("Auth.hasAccount")}
                  </Link>
                ) : null}
              </header>

              <TextField
                errorMessage={errors.username}
                label={t("Auth.username")}
                name="username"
                onChange={(value) => setFieldValue("username", value)}
              />

              <TextField
                type="password"
                errorMessage={errors.password}
                label={t("Auth.password")}
                name="password"
                onChange={(value) => setFieldValue("password", value)}
              />

              <TextField
                type="password"
                errorMessage={errors.confirmPassword}
                label={t("Auth.confirmPassword")}
                name="confirmPassword"
                onChange={(value) => setFieldValue("confirmPassword", value)}
              />

              {cad.registrationCode ? (
                <TextField
                  errorMessage={errors.registrationCode}
                  label={t("Auth.registrationCode")}
                  name="registrationCode"
                  onChange={(value) => setFieldValue("registrationCode", value)}
                />
              ) : null}

              {hasGoogleCaptchaSiteKey ? (
                <p className="mt-5 text-sm text-neutral-700 dark:text-gray-400">
                  This site is protected by reCAPTCHA and the Google{" "}
                  <a className="underline" href="https://policies.google.com/privacy">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a className="underline" href="https://policies.google.com/terms">
                    Terms of Service
                  </a>{" "}
                  apply.
                </p>
              ) : null}

              <Button
                disabled={!isValid || state === "loading"}
                type="submit"
                className="flex items-center justify-center w-full py-1.5 mt-5"
              >
                {state === "loading" ? <Loader className="mr-3" /> : null} {t("Auth.register")}
              </Button>
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

export default function RegisterPage(props: Props) {
  if (!hasGoogleCaptchaSiteKey) {
    return <Register {...props} />;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY ?? ""}
      scriptProps={{ async: true, defer: true, appendTo: "body" }}
      useRecaptchaNet
    >
      <Register {...props} />
    </GoogleReCaptchaProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const cookies = parseCookies({ req });
  const userSavedLocale = cookies.sn_locale ?? null;
  const userSavedIsDarkTheme = cookies.sn_isDarkTheme ?? null;

  const { data } = await handleRequest<cad | null>("/admin/manage/cad-settings").catch(() => ({
    data: null,
  }));

  return {
    props: {
      cad: data ?? {},
      userSavedIsDarkTheme,
      messages: await getTranslations(["auth"], userSavedLocale ?? locale),
    },
  };
};
