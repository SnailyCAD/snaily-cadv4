import { Layout } from "components/Layout";
import { Title } from "components/shared/Title";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";

export default function FourOhFour() {
  return (
    <Layout className="dark:text-white">
      <Title>Forbidden.</Title>

      <h1 className="text-2xl font-semibold">Forbidden.</h1>
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
