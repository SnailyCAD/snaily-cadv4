import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AdvancedCitizensTab } from "components/admin/manage/citizens/AdvancedCitizensTab";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";

export default function ImportCitizensPage() {
  const t = useTranslations("Management");
  const { openModal } = useModal();

  return (
    <AdminLayout>
      <Title>{t("IMPORT_CITIZENS")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("IMPORT_CITIZENS")}</h1>

        <div className="min-w-fit w-fit">
          <Button onClick={() => openModal(ModalIds.ImportCitizens)}>Import via file</Button>
        </div>
      </header>

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
