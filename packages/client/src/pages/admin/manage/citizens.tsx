import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import type { Citizen, User } from "types/prisma";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { AllCitizensTab } from "components/admin/manage/citizens/AllCitizensTab";
import { TabList } from "components/shared/TabList";
import dynamic from "next/dynamic";

const AdvancedCitizensTab = dynamic(
  async () =>
    (await import("components/admin/manage/citizens/AdvancedCitizensTab")).AdvancedCitizensTab,
);

interface Props {
  citizens: (Citizen & { user: User })[];
}

export default function ManageCitizens({ citizens: data }: Props) {
  const [citizens, setCitizens] = React.useState<(Citizen & { user: User | null })[]>(data);
  const t = useTranslations("Management");

  React.useEffect(() => {
    setCitizens(data);
  }, [data]);

  return (
    <AdminLayout>
      <Title>{t("MANAGE_CITIZENS")}</Title>

      <h1 className="text-3xl font-semibold">{t("MANAGE_CITIZENS")}</h1>

      <TabList tabs={["All Citizens", "Advanced"]}>
        <AllCitizensTab setCitizens={setCitizens} citizens={citizens} />
        <AdvancedCitizensTab onSuccess={(data) => setCitizens((p) => [...data, ...p])} />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [citizens, values] = await requestAll(req, [
    ["/admin/manage/citizens", []],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  console.log({ values });

  return {
    props: {
      citizens,
      values,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
