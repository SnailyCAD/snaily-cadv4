import { Form, Formik, FormikHelpers } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import { Discord } from "react-bootstrap-icons";
import useFetch from "lib/useFetch";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import { useTranslations } from "use-intl";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import { findUrl, handleRequest } from "lib/fetch";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Title } from "components/shared/Title";
import { AuthScreenImages } from "components/auth/AuthScreenImages";
import { TwoFactorAuthScreen } from "components/auth/TwoFactorAuthScreen";
import { canUseDiscordAuth } from "lib/utils";
import { useAuth } from "context/AuthContext";

const INITIAL_VALUES = {
  username: "",
  password: "",
  totpCode: undefined as string | undefined,
};

export default function Login() {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");
  const tError = useTranslations("Errors");
  const { DISCORD_AUTH, ALLOW_REGULAR_LOGIN } = useFeatureEnabled();
  const { user, cad } = useAuth();

  const authMessages = {
    banned: tError("userBanned"),
    deleted: tError("userDeleted"),
    discordNameInUse: tError("discordNameInUse"),
    cannotRegisterFirstWithDiscord: tError("cannotRegisterFirstWithDiscord"),
    userBanned: tError("userBanned"),
    whitelistPending: tError("whitelistPending"),
    whitelistDeclined: tError("whitelistDeclined"),
  } as const;

  const errorMessage = authMessages[router.query.error as keyof typeof authMessages];
  const validate = handleValidate(AUTH_SCHEMA);

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json, error } = await execute("/auth/login", {
      data: values,
      method: "POST",
      helpers,
      noToast: "totpCodeRequired",
    });

    if (error === "totpCodeRequired") {
      helpers.setFieldValue("totpCode", "");
      return;
    }

    if (json.hasTempPassword) {
      router.push({
        pathname: "/auth/temp-password",
        query: { tp: values.password },
      });
    } else if (json?.userId) {
      if (process.env.IFRAME_SUPPORT_ENABLED === "true" && json.session) {
        await fetch("/api/token", {
          method: "POST",
          body: json.session,
        });
      }

      const from = typeof router.query.from === "string" ? router.query.from : "/citizen";
      router.push(from);
    }
  }

  function handleDiscordLogin() {
    const url = findUrl();

    const fullUrl = `${url}/auth/discord`;
    window.location.href = fullUrl;
  }

  function handleContinueAs() {
    const from = typeof router.query.from === "string" ? router.query.from : "/citizen";
    router.push(from);
  }

  const showHr = !ALLOW_REGULAR_LOGIN || (DISCORD_AUTH && canUseDiscordAuth()) || !!user?.id;

  return (
    <>
      <Title renderLayoutTitle={false}>{t("login")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <AuthScreenImages />

        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleChange, errors, values, isValid }) => (
            <Form className="relative w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-2 z-10">
              {typeof values.totpCode !== "undefined" ? (
                <TwoFactorAuthScreen
                  errorMessage={errors.totpCode}
                  isLoading={state === "loading"}
                />
              ) : (
                <>
                  <h1 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
                    {t("login")}
                  </h1>

                  {errorMessage ? (
                    <p className="bg-red-500/80 text-black w-full py-1.5 px-3 my-3 rounded-md">
                      {errorMessage}
                    </p>
                  ) : null}

                  {ALLOW_REGULAR_LOGIN ? (
                    <>
                      <FormField errorMessage={errors.username} label={t("username")}>
                        <Input type="text" name="username" onChange={handleChange} />
                      </FormField>

                      <FormField errorMessage={errors.password} label={t("password")}>
                        <PasswordInput name="password" onChange={handleChange} />
                      </FormField>

                      <div className="mt-3">
                        <Link href="/auth/register">
                          <a className="inline-block mb-3 underline dark:text-gray-200">
                            {t("noAccount")}
                          </a>
                        </Link>

                        <Button
                          disabled={!isValid || state === "loading"}
                          type="submit"
                          className="flex items-center justify-center w-full gap-3"
                        >
                          {state === "loading" ? <Loader /> : null} {t("login")}
                        </Button>
                      </div>
                    </>
                  ) : null}

                  {showHr ? <hr className="my-5 border-[1.5px] rounded-md border-gray-3" /> : null}

                  {user ? (
                    <Button type="button" onClick={handleContinueAs} className="w-full mb-2">
                      {t.rich("continueAs", { username: user.username })}
                    </Button>
                  ) : null}

                  {DISCORD_AUTH && canUseDiscordAuth() ? (
                    <Button
                      type="button"
                      onClick={handleDiscordLogin}
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      <Discord />
                      {t("loginViaDiscord")}
                    </Button>
                  ) : null}
                </>
              )}
            </Form>
          )}
        </Formik>
        {cad?.version ? (
          <p className="text-gray-900 dark:text-gray-200 block mt-3 text-base">v{cad.version}</p>
        ) : null}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data } = await handleRequest("/admin/manage/cad-settings").catch(() => ({
    data: null,
  }));

  return {
    props: {
      cad: data ?? {},
      messages: await getTranslations(["auth"], locale),
    },
  };
};
