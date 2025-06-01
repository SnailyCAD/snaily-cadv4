import * as React from "react";
import { Layout } from "components/Layout";
import type { GetStaticProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { handleRequest } from "lib/fetch";
import { useAuth } from "context/AuthContext";

export default function FourOhFour() {
  const { setCad } = useAuth();

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
    <Layout className="dark:text-white">{/* Entferne die Anzeige von "page not found" */}</Layout>
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
