import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Title } from "components/shared/Title";
import { AuthScreenImages } from "components/auth/auth-screen-images";
import { LocalhostDetector } from "components/auth/localhost-detector";
import { DemoDetector } from "components/auth/demo-detector";
import { parseCookies } from "nookies";
import { VersionDisplay } from "components/shared/VersionDisplay";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import { LoginForm } from "components/auth/login/login-form";
import { useRouter } from "next/router";
import { requestAll } from "lib/utils";
import { ApiVerification } from "components/auth/api-verification";

interface Props {
  isLocalhost: boolean;
  isCORSError: boolean;
  CORS_ORIGIN_URL: string | null;
}

export default function Login(props: Props) {
  const { cad } = useAuth();
  const t = useTranslations("Auth");
  const router = useRouter();

  async function handleSubmit({ from }: { from: string }) {
    router.push(from);
  }

  return (
    <>
      <Title renderLayoutTitle={false}>{t("login")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <AuthScreenImages />
        <LocalhostDetector isLocalhost={props.isLocalhost} />
        <ApiVerification isCORSError={props.isCORSError} CORS_ORIGIN_URL={props.CORS_ORIGIN_URL} />
        <DemoDetector />

        <LoginForm onFormSubmitted={handleSubmit} />

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

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const cookies = parseCookies({ req });
  const userSavedLocale = cookies.sn_locale ?? null;
  const userSavedIsDarkTheme = cookies.sn_isDarkTheme ?? null;

  const [data] = await requestAll(req, [["/admin/manage/cad-settings", null]]);

  const CORS_ORIGIN_URL = process.env.CORS_ORIGIN_URL ?? null;
  const NEXT_PUBLIC_CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? null;

  const isWildcard = CORS_ORIGIN_URL?.includes("*") ?? false;
  const isLocalhost =
    (CORS_ORIGIN_URL?.includes("localhost") || NEXT_PUBLIC_CLIENT_URL?.includes("localhost")) ??
    false;

  const isDefaultENvValue = CORS_ORIGIN_URL === "http://192.168.x.x:3000";
  const doURLsMatch = isWildcard
    ? true
    : CORS_ORIGIN_URL === NEXT_PUBLIC_CLIENT_URL && !isDefaultENvValue;

  return {
    props: {
      isLocalhost,
      isCORSError: !doURLsMatch,
      CORS_ORIGIN_URL,
      cad: data,
      userSavedLocale,
      userSavedIsDarkTheme,
      messages: await getTranslations(["auth"], userSavedLocale ?? locale),
    },
  };
};
