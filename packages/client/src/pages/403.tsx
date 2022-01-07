import { Layout } from "components/Layout";
import { Title } from "components/shared/Title";
import { getTranslations } from "lib/getTranslation";
import { GetStaticProps } from "next";

export default function FourOhFour() {
  return (
    <Layout className="dark:text-white">
      <Title>Forbidden.</Title>

      <h1 className="text-2xl font-semibold">Forbidden.</h1>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      messages: {
        ...(await getTranslations(["common"], locale)),
      },
    },
  };
};
