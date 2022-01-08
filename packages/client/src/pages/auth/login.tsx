import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";

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

const INITIAL_VALUES = {
  username: "",
  password: "",
};

export default function Login() {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");
  const error = useTranslations("Errors");
  const { DISCORD_AUTH } = useFeatureEnabled();

  const authMessages = {
    banned: error("userBanned"),
    deleted: error("userDeleted"),
    discordNameInUse: error("discordNameInUse"),
    cannotRegisterFirstWithDiscord: error("cannotRegisterFirstWithDiscord"),
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
      if (process.env.IFRAME_SUPPORT_ENABLED === "true" && json.session) {
        await fetch("/api/token", {
          method: "POST",
          body: json.session,
        });
      }

      router.push("/citizen");
    }
  }

  function handleDiscordLogin() {
    const url = findUrl();

    const fullUrl = `${url}/auth/discord`;
    window.location.href = fullUrl;
  }

  return (
    <>
      <Title>{t("login")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <AuthScreenImages />

        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleSubmit, handleChange, errors, isValid }) => (
            <form
              className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-2 z-10"
              onSubmit={handleSubmit}
            >
              <h1 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
                {t("login")}
              </h1>

              {errorMessage ? (
                <p className="bg-red-500/80 text-black w-full py-1.5 px-3 my-3 rounded-md">
                  {errorMessage}
                </p>
              ) : null}

              <FormField errorMessage={errors.username} label={t("username")}>
                <Input type="text" name="username" onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.password} label={t("password")}>
                <PasswordInput name="password" onChange={handleChange} />
              </FormField>

              <div className="mt-3">
                <Link href="/auth/register">
                  <a className="inline-block mb-3 underline dark:text-gray-200">{t("noAccount")}</a>
                </Link>

                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="flex items-center justify-center w-full gap-3"
                >
                  {state === "loading" ? <Loader /> : null} {t("login")}
                </Button>
              </div>

              {DISCORD_AUTH ? (
                <>
                  <hr className="my-5 border-[1.5px] rounded-md border-gray-3" />

                  <Button type="button" onClick={handleDiscordLogin} className="w-full">
                    Login via Discord
                  </Button>
                </>
              ) : null}
            </form>
          )}
        </Formik>
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
