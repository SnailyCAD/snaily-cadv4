import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AdvancedCitizensTab } from "components/admin/manage/citizens/AdvancedCitizensTab";

export default function ImportCitizensPage() {
  const t = useTranslations("Management");

  return (
    <AdminLayout>
      <Title>{t("IMPORT_CITIZENS")}</Title>

      <h1 className="text-3xl font-semibold">{t("IMPORT_CITIZENS")}</h1>

      <AdvancedCitizensTab />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [["/admin/values/gender?paths=ethnicity", []]]);

  return {
    props: {
      // citizens,
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
