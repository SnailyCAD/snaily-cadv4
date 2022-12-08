import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AdvancedCitizensTab } from "components/admin/manage/citizens/AdvancedCitizensTab";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { Rank } from "@snailycad/types";
import { Permissions } from "@snailycad/permissions";

export default function ImportCitizensPage() {
  const t = useTranslations("Management");
  const { openModal } = useModal();

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ImportCitizens],
      }}
    >
      <header>
        <div className="flex items-center justify-between">
          <Title className="!mb-0">{t("IMPORT_CITIZENS")}</Title>

          <div className="min-w-fit w-fit">
            <Button onPress={() => openModal(ModalIds.ImportCitizens)}>Import via file</Button>
          </div>
        </div>

        <p className="my-2 text-neutral-700 dark:text-gray-400 max-w-2xl">
          {t("importCitizensDescription")}
        </p>
      </header>

      <AdvancedCitizensTab />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [values] = await requestAll(req, [["/admin/values/gender?paths=ethnicity", []]]);
  const user = await getSessionUser(req);

  return {
    props: {
      values,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
