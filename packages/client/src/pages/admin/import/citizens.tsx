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

      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{t("IMPORT_CITIZENS")}</h1>

          <div className="min-w-fit w-fit">
            <Button onClick={() => openModal(ModalIds.ImportCitizens)}>Import via file</Button>
          </div>
        </div>

        <p className="my-2 mt-5 dark:text-gray-300 max-w-2xl">
          Here you can mass import citizens that may not be connected to a registered user account.
        </p>
      </header>

      <AdvancedCitizensTab />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [["/admin/values/gender?paths=ethnicity", []]]);

  return {
    props: {
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
