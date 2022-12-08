import { Form, Formik, FormikHelpers } from "formik";
import Link from "next/link";
import { Discord, Steam } from "react-bootstrap-icons";
import { Button, Loader, TextField } from "@snailycad/ui";
import { TwoFactorAuthScreen } from "components/auth/TwoFactorAuthScreen";
import { getAPIUrl } from "@snailycad/utils/api-url";
import { useRouter } from "next/router";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { handleValidate } from "lib/handleValidate";
import { AUTH_SCHEMA } from "@snailycad/schemas";
import type { PostLoginUserData } from "@snailycad/types/api";
import { canUseThirdPartyConnections } from "lib/utils";
import { classNames } from "lib/classNames";

const INITIAL_VALUES = {
  username: "",
  password: "",
  totpCode: undefined as string | undefined,
};

interface Props {
  isWithinModal?: boolean;
  onFormSubmitted(data: { from: string }): void;
}

export function LoginForm({ onFormSubmitted, isWithinModal }: Props) {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");
  const tError = useTranslations("Errors");
  const { DISCORD_AUTH, ALLOW_REGULAR_LOGIN, STEAM_OAUTH } = useFeatureEnabled();
  const { user } = useAuth();

  const authMessages = {
    banned: tError("userBanned"),
    deleted: tError("userDeleted"),
    discordNameInUse: tError("discordNameInUse"),
    cannotRegisterFirstWithDiscord: tError("cannotRegisterFirstWithDiscord"),
    steamNameInUse: tError("steamNameInUse"),
    cannotRegisterFirstWithSteam: tError("cannotRegisterFirstWithSteam"),
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
    const { json, error } = await execute<PostLoginUserData, typeof INITIAL_VALUES>({
      path: "/auth/login",
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
      const from = typeof router.query.from === "string" ? router.query.from : "/citizen";
      onFormSubmitted({ from });
    }
  }

  function handleDiscordLogin() {
    const url = getAPIUrl();

    const fullUrl = `${url}/auth/discord`;
    window.location.href = fullUrl;
  }

  function handleSteamLogin() {
    const url = getAPIUrl();

    const fullUrl = `${url}/auth/steam`;
    window.location.href = fullUrl;
  }

  function handleContinueAs() {
    const from = typeof router.query.from === "string" ? router.query.from : "/citizen";
    router.push(from);
  }

  const useThirdPartyConnectionsAbility = canUseThirdPartyConnections();
  const showSteamOAuth = STEAM_OAUTH && useThirdPartyConnectionsAbility;
  const showDiscordOAuth = DISCORD_AUTH && useThirdPartyConnectionsAbility;

  const showHorizontalLine = ALLOW_REGULAR_LOGIN && (showSteamOAuth || showDiscordOAuth || !!user);

  return (
    <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
      {({ setFieldValue, errors, values, isValid }) => (
        <Form
          className={classNames(
            isWithinModal
              ? "bg-transparent pb-3"
              : "shadow-md p-6 bg-gray-100 dark:bg-primary dark:border dark:border-secondary",
            "relative w-full max-w-md rounded-lg z-10",
          )}
        >
          {typeof values.totpCode !== "undefined" ? (
            <TwoFactorAuthScreen errorMessage={errors.totpCode} isLoading={state === "loading"} />
          ) : (
            <>
              <header className="mb-5">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t("login")}</h1>

                {ALLOW_REGULAR_LOGIN && !isWithinModal ? (
                  <Link
                    href="/auth/register"
                    className="inline-block mt-2 underline text-neutral-700 dark:text-gray-200"
                  >
                    {t("noAccount")}
                  </Link>
                ) : null}
              </header>

              {errorMessage ? (
                <div
                  role="alert"
                  className="bg-red-500/80 text-black w-full py-1.5 px-3 my-3 rounded-md"
                >
                  {errorMessage}
                </div>
              ) : null}

              {ALLOW_REGULAR_LOGIN ? (
                <>
                  <TextField
                    errorMessage={errors.username}
                    autoFocus
                    isRequired
                    label="Username"
                    value={values.username}
                    onChange={(value) => setFieldValue("username", value)}
                  />

                  <TextField
                    type="password"
                    errorMessage={errors.password}
                    isRequired
                    label="Password"
                    value={values.password}
                    onChange={(value) => setFieldValue("password", value)}
                  />

                  <Button
                    disabled={!isValid || state === "loading"}
                    type="submit"
                    className="flex items-center justify-center w-full gap-3 mt-5"
                  >
                    {state === "loading" ? <Loader /> : null} {t("login")}
                  </Button>
                </>
              ) : null}

              {showHorizontalLine ? (
                <div className="my-7 flex items-center gap-2">
                  <span className="h-[2px] bg-secondary w-full rounded-md" />
                  <span className="min-w-fit text-sm uppercase dark:text-gray-300">{t("or")}</span>
                  <span className="h-[2px] bg-secondary w-full rounded-md" />
                </div>
              ) : null}

              {user && !isWithinModal ? (
                <Button type="button" onPress={handleContinueAs} className="w-full mb-2">
                  {t("continueAs", { username: user.username })}
                </Button>
              ) : null}

              {showDiscordOAuth ? (
                <Button
                  type="button"
                  onPress={handleDiscordLogin}
                  className="flex items-center justify-center gap-3 w-full"
                >
                  <Discord />
                  {t("loginViaDiscord")}
                </Button>
              ) : null}

              {showSteamOAuth ? (
                <Button
                  type="button"
                  onPress={handleSteamLogin}
                  className="flex items-center justify-center gap-3 w-full mt-2"
                >
                  <Steam />
                  {t("loginViaSteam")}
                </Button>
              ) : null}
            </>
          )}
        </Form>
      )}
    </Formik>
  );
}
