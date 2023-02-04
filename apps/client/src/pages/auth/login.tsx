import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Title } from "components/shared/Title";
import { AuthScreenImages } from "components/auth/AuthScreenImages";
import { LocalhostDetector } from "components/auth/LocalhostDetector";
import { parseCookies } from "nookies";
import { VersionDisplay } from "components/shared/VersionDisplay";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import { LoginForm } from "components/auth/login/LoginForm";
import { useRouter } from "next/router";
import { requestAll } from "lib/utils";

export default function Login() {
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
        <LocalhostDetector />

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

  const [data] = await requestAll(req, [["/admin/manage/cad-settings", {}]]);

  return {
    props: {
      cad: data ?? {},
      userSavedLocale,
      userSavedIsDarkTheme,
      messages: await getTranslations(["auth"], userSavedLocale ?? locale),
    },
  };
};
