import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { handleRequest } from "lib/fetch";
import { Title } from "components/shared/Title";
import { AuthScreenImages } from "components/auth/AuthScreenImages";
import { LocalhostDetector } from "components/auth/LocalhostDetector";
import { parseCookies } from "nookies";
import { VersionDisplay } from "components/shared/VersionDisplay";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import { LoginForm } from "components/auth/login/LoginForm";
import { useRouter } from "next/router";
import type { PostLoginUserData } from "@snailycad/types/api";

export default function Login() {
  const { cad } = useAuth();
  const t = useTranslations("Auth");
  const router = useRouter();

  async function handleSubmit({ from, json }: { from: string; json: PostLoginUserData }) {
    if (process.env.IFRAME_SUPPORT_ENABLED === "true" && json.session) {
      await fetch("/api/token", {
        method: "POST",
        body: json.session,
      });
    }

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
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const cookies = parseCookies({ req });
  const userSavedLocale = cookies.sn_locale ?? null;
  const userSavedIsDarkTheme = cookies.sn_isDarkTheme ?? null;

  const { data } = await handleRequest("/admin/manage/cad-settings").catch(() => ({
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
