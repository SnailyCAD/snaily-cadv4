import { Layout } from "components/Layout";
import { getTranslations } from "lib/getTranslation";
import { GetStaticProps } from "next";
import Head from "next/head";

export default function FourOhFour() {
  return (
    <Layout className="dark:text-white">
      <Head>
        <title>Forbidden.</title>
      </Head>

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
