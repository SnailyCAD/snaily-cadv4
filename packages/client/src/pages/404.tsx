import * as React from "react";
import { Layout } from "components/Layout";
import type { GetStaticProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Title } from "components/shared/Title";
import { handleRequest } from "lib/fetch";
import { useAuth } from "context/AuthContext";

export default function FourOhFour() {
  const { setCad } = useAuth();

  /**
   * the 404 page can only be static due to Next.js' restrictions :/
   */
  const fetchCAD = React.useCallback(async () => {
    const { data } = await handleRequest("/admin/manage/cad-settings").catch(() => ({
      data: null,
    }));

    if (data) {
      setCad(data);
    }
  }, [setCad]);

  React.useEffect(() => {
    fetchCAD();
  }, [fetchCAD]);

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
