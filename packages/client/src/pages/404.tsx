import Head from "next/head";
import { Layout } from "components/Layout";

export default function FourOhFour() {
  return (
    <Layout className="dark:text-white">
      <Head>
        <title>Page not found.</title>
      </Head>

      <h1 className="text-2xl font-semibold">Page not found.</h1>
    </Layout>
  );
}
