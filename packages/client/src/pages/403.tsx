import { Layout } from "components/Layout";
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
