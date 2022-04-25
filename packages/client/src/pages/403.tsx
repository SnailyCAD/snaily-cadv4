import { Layout } from "components/Layout";
import { Title } from "components/shared/Title";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { useTranslations } from "next-intl";
import type { GetServerSideProps } from "next";

export default function FourOhFour() {
  const t = useTranslations("Errors");

  return (
    <Layout className="dark:text-white">
      <Title>{t("forbidden")}</Title>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data } = await handleRequest("/admin/manage/cad-settings").catch(() => ({
    data: null,
  }));

  return {
    props: {
      cad: data ?? {},
      messages: {
        ...(await getTranslations(["common"], locale)),
      },
    },
  };
};
