import { Layout } from "components/Layout";
import { GetStaticProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Title } from "components/shared/Title";

export default function FourOhFour() {
  return (
    <Layout className="dark:text-white">
      <Title>Page not found.</Title>

      <h1 className="text-2xl font-semibold">Page not found.</h1>
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
